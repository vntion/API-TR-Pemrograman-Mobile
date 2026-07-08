import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/menu/{id}/ingredients:
 *   post:
 *     summary: Set menu item ingredients (recipe)
 *     description: Replace all ingredients for a menu item with the provided list. Requires manager role.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The menu item ID to set ingredients for.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredients
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ingredient_id
 *                     - quantity_needed
 *                   properties:
 *                     ingredient_id:
 *                       type: integer
 *                       description: The ingredient ID.
 *                     quantity_needed:
 *                       type: number
 *                       description: Quantity of the ingredient needed for the recipe.
 *     responses:
 *       200:
 *         description: Recipe updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resep berhasil diperbarui
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       menu_id:
 *                         type: integer
 *                       ingredient_id:
 *                         type: integer
 *                       quantity_needed:
 *                         type: number
 *                       ingredients:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           unit:
 *                             type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or empty ingredients list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Daftar bahan baku tidak boleh kosong
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
 *       404:
 *         description: Menu item not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menu tidak ditemukan
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Failed to save recipe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gagal menyimpan resep
 *                 error:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];
  const id = Number(params.id);
  const body = await request.json();

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

  // Check if menu exists
  const { data: menu } = await supabaseClient()
    .from('menus')
    .select('id')
    .eq('id', id)
    .single();

  if (!menu) {
    return NextResponse.json(
      { message: 'Menu tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { ingredients } = body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { message: 'Daftar bahan baku tidak boleh kosong', success: false },
      { status: 400 },
    );
  }

  // Delete existing ingredients for this menu
  await supabaseClient()
    .from('menu_ingredients')
    .delete()
    .eq('menu_id', Number(id));

  // Insert new ingredients
  const newIngredients = ingredients.map((item: { ingredient_id: number; quantity_needed: number }) => ({
    menu_id: Number(id),
    ingredient_id: item.ingredient_id,
    quantity_needed: item.quantity_needed,
  }));

  const { data, error } = await supabaseClient()
    .from('menu_ingredients')
    .insert(newIngredients)
    .select('*, ingredients(id, name, unit)');

  if (error) {
    return NextResponse.json(
      { message: 'Gagal menyimpan resep', error: error.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Resep berhasil diperbarui',
    data,
    success: true,
  });
}
