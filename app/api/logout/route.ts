import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/logout:
 *   delete:
 *     summary: Logout pengguna
 *     description: Menghapus session token pengguna yang sedang login. Memerlukan Bearer token.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Logout berhasil
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
 *                   example: "Logout berhasil"
 */
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  const token = authHeader!.split(' ')[1];

  await supabaseClient().from('session_tokens').delete().eq('token', token);

  return NextResponse.json(
    { success: true, message: 'Logout berhasil' },
    { status: 204 },
  );
}
