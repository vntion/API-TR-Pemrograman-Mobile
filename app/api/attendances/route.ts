import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/attendances:
 *   get:
 *     summary: Daftar absensi
 *     description: Mengambil daftar semua data absensi. Dapat difilter berdasarkan tanggal dan nama. Memerlukan Bearer token.
 *     tags:
 *       - Attendances
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter berdasarkan tanggal (format YYYY-MM-DD)
 *         example: "2026-07-08"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama pengguna
 *         example: "john"
 *     responses:
 *       200:
 *         description: Daftar absensi berhasil diambil
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
 *                       user_id:
 *                         type: integer
 *                       attendance_date:
 *                         type: string
 *                         format: date
 *                       check_in_time:
 *                         type: string
 *                         format: date-time
 *                       check_out_time:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       users:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           role:
 *                             type: string
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *                 error:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const search = searchParams.get('search');

  let query;

  if (search) {
    query = supabaseClient()
      .from('attendances')
      .select('*, users!inner(id, name, role)')
      .ilike('users.name', `%${search}%`)
      .order('attendance_date', { ascending: false });
  } else {
    query = supabaseClient()
      .from('attendances')
      .select('*, users(id, name, role)')
      .order('attendance_date', { ascending: false });
  }

  if (date) {
    query = query.eq('attendance_date', date);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', error: error.message, success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data,
    success: true,
  });
}
