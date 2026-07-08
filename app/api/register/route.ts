import { supabaseClient } from '@/utils/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const ENUM_ROLES = ['employee', 'manager'];

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registrasi akun baru
 *     description: Membuat akun pengguna baru. Hanya dapat diakses oleh pengguna dengan role **manager**. Memerlukan Bearer token.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - password
 *               - role
 *             properties:
 *               nama:
 *                 type: string
 *                 example: "jane"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum:
 *                   - employee
 *                   - manager
 *                 example: "employee"
 *     responses:
 *       201:
 *         description: Akun berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Akun berhasil dibuat"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     nama:
 *                       type: string
 *                       example: "jane"
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nama tidak boleh kosong"
 *                 success:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized - bukan manager
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Akun gagal dibuat"
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const body = await request.json();

  const token = authHeader!.split(' ')[1];

  const name = body.nama;
  const password = body.password;
  const role = body.role as string;

  if (!name) {
    return NextResponse.json(
      { message: 'Nama tidak boleh kosong', success: false },
      { status: 400 },
    );
  }

  if (!password) {
    return NextResponse.json(
      { message: 'Password tidak boleh kosong', success: false },
      { status: 400 },
    );
  }

  if (!role) {
    return NextResponse.json(
      { message: 'Role tidak boleh kosong', success: false },
      { status: 400 },
    );
  }

  if (!ENUM_ROLES.some(roles => roles === role.trim().toLowerCase())) {
    return NextResponse.json(
      { message: 'Role hanya employee atau manager', success: false },
      { status: 400 },
    );
  }

  const { data: session } = await supabaseClient()
    .from('session_tokens')
    .select('users(role)')
    .eq('token', token);

  console.log(session);

  if (session?.users?.role !== 'manager') {
    return NextResponse.json(
      { message: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const { data, error } = await supabaseClient()
    .from('users')
    .insert({
      name,
      password: hashedPassword,
      role,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { message: 'Akun gagal dibuat', success: false },
      { status: 500 },
    );
  }

  // if(session?.used_id?.id
  return NextResponse.json(
    {
      message: 'Akun berhasil dibuat',
      success: true,
      user: { id: data.id, nama: data.name },
    },
    { status: 201 },
  );
}
