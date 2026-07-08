import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/attendances/check-out:
 *   put:
 *     summary: Check-out absensi
 *     description: Melakukan check-out absensi untuk hari ini. Pengguna diidentifikasi melalui Bearer token. Tidak memerlukan request body.
 *     tags:
 *       - Attendances
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Check-out berhasil"
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
 *         description: Belum check-in atau sudah check-out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Anda belum check-in hari ini"
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
export async function PUT(request: NextRequest) {
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

    // Check if checked in today
    const { data: attendance } = await supabaseClient()
      .from('attendances')
      .select('id, check_out_time')
      .eq('user_id', session.used_id)
      .eq('attendance_date', today)
      .single();

    if (!attendance) {
      return NextResponse.json(
        { message: 'Anda belum check-in hari ini', success: false },
        { status: 400 },
      );
    }

    if (attendance.check_out_time) {
      return NextResponse.json(
        { message: 'Anda sudah check-out hari ini', success: false },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseClient()
      .from('attendances')
      .update({ check_out_time: now })
      .eq('id', attendance.id)
      .select('*, users(id, name)')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal check-out', error: error.message, success: false },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Check-out berhasil',
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
