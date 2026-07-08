import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menu items
 *     description: Retrieve a list of menu items with optional filtering by category and search query.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter menus by category ID. Use 0 or omit to get all categories.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search menus by name (case-insensitive partial match).
 *     responses:
 *       200:
 *         description: List of menu items retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       is_available:
 *                         type: boolean
 *                       image_url:
 *                         type: string
 *                       categories:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category_id');
  const searchQuery = searchParams.get('search');

  let menuQuery = supabaseClient()
    .from('menus')
    .select(
      'id, name, description, price, is_available, image_url, categories(id, name)',
    );

  if (categoryId && categoryId !== '0') {
    menuQuery = menuQuery.eq('category_id', Number(categoryId));
  }

  if (searchQuery) {
    menuQuery = menuQuery.ilike('name', `%${searchQuery}%`);
  }

  const { data, error } = await menuQuery;

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data,
    success: true,
  });
}

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Create a new menu item
 *     description: Create a new menu item with an optional image upload. Requires manager role.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - dekripsi
 *               - harga
 *               - tersedia
 *               - kategori_id
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Menu item name.
 *               dekripsi:
 *                 type: string
 *                 description: Menu item description.
 *               harga:
 *                 type: string
 *                 description: Menu item price.
 *               tersedia:
 *                 type: string
 *                 description: "Availability flag ('true'/'1' for available)."
 *               kategori_id:
 *                 type: string
 *                 description: Category ID for the menu item.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file for the menu item.
 *     responses:
 *       200:
 *         description: Menu item created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menu berhasil dibuat
 *                 data:
 *                   type: object
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ada field yang masih kosong
 *                 success:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized - not a manager.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader!.split(' ')[1];

    const { data: session } = await supabaseClient()
      .from('session_tokens')
      .select('users(role)')
      .eq('token', token)
      .single();

    if (session?.users?.role !== 'manager') {
      return NextResponse.json(
        { message: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const nama = formData.get('nama') as string;
    const dekripsi = formData.get('dekripsi') as string;
    const harga = formData.get('harga') as string;
    const tersedia = formData.get('tersedia') as string;
    const kategori_id = formData.get('kategori_id') as string;
    const file = formData.get('image') as File | null;

    const bodyValue = [nama, dekripsi, harga, tersedia, kategori_id];

    if (
      bodyValue.some(item => item === undefined || item === null || item === '')
    ) {
      return NextResponse.json(
        { message: 'Ada field yang masih kosong', success: false },
        { status: 400 },
      );
    }

    let imageUrl = '';

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseClient()
        .storage.from('menus')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            message: 'Gagal mengupload gambar',
            error: uploadError.message,
            success: false,
          },
          { status: 500 },
        );
      }

      const { data: publicUrlData } = supabaseClient()
        .storage.from('menus')
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabaseClient()
      .from('menus')
      .insert({
        name: nama,
        description: dekripsi,
        price: Number(harga),
        is_available: tersedia === 'true' || tersedia === '1',
        category_id: Number(kategori_id),
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Something went wrong', success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Menu berhasil dibuat',
      data,
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }
}
