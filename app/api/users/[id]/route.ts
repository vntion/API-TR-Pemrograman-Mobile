import { supabaseClient } from '@/utils/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID. Requires Bearer token authentication.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [karyawan, manager]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pengguna tidak ditemukan
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
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  const { data: user, error } = await supabaseClient()
    .from('users')
    .select('id, name, role, created_at, updated_at')
    .eq('id', id)
    .single();

  if (!user) {
    return NextResponse.json(
      { message: 'Pengguna tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: user,
    success: true,
  });
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update a user's name, password, or role. Requires Bearer token authentication and manager role.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: New name for the user
 *                 example: John Doe
 *               password:
 *                 type: string
 *                 description: New password (will be hashed)
 *                 example: newpassword123
 *               role:
 *                 type: string
 *                 enum: [karyawan, manager]
 *                 description: New role for the user
 *                 example: karyawan
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pengguna berhasil diperbarui
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid role value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role hanya karyawan atau manager
 *                 success:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized - not a manager
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pengguna tidak ditemukan
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
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const { data: checkUser } = await supabaseClient()
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  if (!checkUser) {
    return NextResponse.json(
      { message: 'Pengguna tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const updateData: Record<string, string | number | boolean> = {};

  if (body.nama !== undefined) updateData.name = body.nama;
  if (body.role !== undefined) {
    const ENUM_ROLES = ['karyawan', 'manager'];
    if (!ENUM_ROLES.includes(body.role.trim().toLowerCase())) {
      return NextResponse.json(
        { message: 'Role hanya karyawan atau manager', success: false },
        { status: 400 },
      );
    }
    updateData.role = body.role;
  }
  if (body.password !== undefined) {
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(body.password, saltRounds);
  }

  const { data, error } = await supabaseClient()
    .from('users')
    .update(updateData as any)
    .eq('id', id)
    .select('id, name, role, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Pengguna berhasil diperbarui',
    data,
    success: true,
  });
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user by their ID. Requires Bearer token authentication and manager role.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pengguna berhasil dihapus
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - not a manager
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pengguna tidak ditemukan
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
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];
  const id = Number(params.id);

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

  const { data: checkUser } = await supabaseClient()
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  if (!checkUser) {
    return NextResponse.json(
      { message: 'Pengguna tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { error } = await supabaseClient().from('users').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Pengguna berhasil dihapus',
    success: true,
  });
}
