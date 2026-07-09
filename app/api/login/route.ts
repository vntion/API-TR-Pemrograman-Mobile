import { supabaseClient } from '@/utils/client';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login pengguna
 *     description: Autentikasi pengguna dengan nama dan password. Endpoint ini bersifat publik dan tidak memerlukan token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - password
 *             properties:
 *               nama:
 *                 type: string
 *                 example: "john"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login berhasil"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "abc123sessiontoken"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "john"
 *       400:
 *         description: Request body tidak valid
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
 *       404:
 *         description: Nama atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email atau password tidak ditemukan"
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
 *                   example: "Something went wrong"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { message: 'Bad Request', success: false },
        { status: 400 },
      );
    }

    const name = body.nama;
    const password = body.password;

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

    const { data: user, error: loginErr } = await supabaseClient()
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (!user || loginErr) {
      return NextResponse.json(
        { message: 'Email atau password tidak ditemukan', success: false },
        { status: 404 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Email atau password tidak ditemukan', success: false },
        { status: 404 },
      );
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await supabaseClient()
      .from('session_tokens')
      .delete()
      .eq('used_id', user.id);

    const { error: sessionErr } = await supabaseClient()
      .from('session_tokens')
      .insert({
        used_id: user.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionErr) {
      return NextResponse.json(
        { message: 'Token gagal dibuat', success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Login berhasil',
      success: true,
      token: sessionToken,
      user: { id: user.id, name: user.name },
    });
  } catch (_err) {
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 },
    );
  }
}
