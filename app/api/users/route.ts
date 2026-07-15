import { supabaseClient } from '@/utils/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar semua pengguna
 *     description: Endpoint ini mengembalikan daftar pengguna yang ada di dalam sistem (dummy data).
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       role:
 *                         type: string
 *                         example: employee
 */
export async function GET() {
  // Simulasi data dari database

  const { data, error } = await supabaseClient()
    .from('users')
    .select('id, name, role');

  if (error) {
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: true, data });
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Menambahkan pengguna baru
 *     description: Endpoint ini digunakan untuk membuat pengguna baru. Hanya manager yang dapat membuat pengguna.
 *     tags:
 *       - Users
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
 *                 example: New User
 *               password:
 *                 type: string
 *                 example: rahasia123
 *               role:
 *                 type: string
 *                 description: Role pengguna ('manager' atau 'karyawan')
 *                 example: karyawan
 *     responses:
 *       201:
 *         description: Berhasil menambahkan pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pengguna berhasil dibuat
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: New User
 *                     role:
 *                       type: string
 *                       example: karyawan
 *       400:
 *         description: Bad Request, parameter tidak lengkap atau role tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Field masih ada yang kosong
 *       401:
 *         description: Unauthorized, token tidak valid atau pengguna bukan manager
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Pengguna gagal dibuat
 *                 error:
 *                   type: string
 *                   example: error_message
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];

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

  const name = body.nama as string;
  const password = body.password as string;
  const role = body.role as string;

  if (!name || !password || !role) {
    return NextResponse.json(
      { success: false, message: 'Field masih ada yang kosong' },
      { status: 400 },
    );
  }

  const ROLE_ENUM = ['manager', 'karyawan'];

  if (!ROLE_ENUM.includes(role.toLowerCase().trim())) {
    return NextResponse.json(
      { success: false, message: 'Role hanya manager atau karyawan' },
      { status: 400 },
    );
  }

  const salt = 10;
  const hashedPassword = await bcrypt.hash(password, salt);

  const { data: newUser, error: userErr } = await supabaseClient()
    .from('users')
    .insert({ name, password: hashedPassword, role })
    .select()
    .single();

  if (userErr) {
    return NextResponse.json(
      {
        success: false,
        message: 'Pengguna gagal dibuat',
        error: userErr.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, message: 'Pengguna berhasil dibuat', data: newUser },
    { status: 201 },
  );
}
