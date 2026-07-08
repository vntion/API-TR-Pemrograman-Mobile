import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/attendances/check-in:
 *   post:
 *     summary: Check-in absensi
 *     description: Melakukan check-in absensi untuk hari ini. Pengguna diidentifikasi melalui Bearer token. Tidak memerlukan request body.
 *     tags:
 *       - Attendances
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Check-in berhasil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     attendance_date:
 *                       type: string
 *                       format: date
 *                     check_in_time:
 *                       type: string
 *                       format: date-time
 *                     check_out_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "hadir"
 *                     users:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Sudah check-in hari ini
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Anda sudah check-in hari ini"
 *                 success:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
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
 *                   example: "Something went wrong"
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
      .select('used_id, users(id, name)')
      .eq('token', token)
      .single();

    if (!session || !session.used_id) {
      return NextResponse.json(
        { message: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabaseClient()
      .from('attendances')
      .select('id')
      .eq('user_id', session.used_id)
      .eq('attendance_date', today)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'Anda sudah check-in hari ini', success: false },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseClient()
      .from('attendances')
      .insert({
        user_id: session.used_id,
        attendance_date: today,
        check_in_time: now,
        status: 'hadir',
      })
      .select('*, users(id, name)')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal check-in', error: error.message, success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Check-in berhasil',
      data,
      success: true,
    });
  } catch (_err) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }
}
