import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/transactions/{id}/status:
 *   put:
 *     summary: Update transaction status
 *     description: Update the status of a transaction by its ID. Valid statuses are pending, completed, or cancelled. Requires Bearer token authentication.
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Transaction status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Status transaksi berhasil diubah menjadi completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     payment_method:
 *                       type: string
 *                     status:
 *                       type: string
 *                     subtotal:
 *                       type: number
 *                     tax_amount:
 *                       type: number
 *                     total_amount:
 *                       type: number
 *                     user_id:
 *                       type: integer
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or missing status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Status tidak valid. Gunakan: pending, completed, atau cancelled"
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
 *                   example: Unauthorized
 *                 success:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaksi tidak ditemukan
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];
  const id = Number(params.id);
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json(
      { message: 'Status harus diisi', success: false },
      { status: 400 },
    );
  }

  const validStatuses = ['pending', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { message: 'Status tidak valid. Gunakan: pending, completed, atau cancelled', success: false },
      { status: 400 },
    );
  }

  const { data: session } = await supabaseClient()
    .from('session_tokens')
    .select('users(role)')
    .eq('token', token)
    .single();

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized', success: false },
      { status: 401 },
    );
  }

  const { data: checkTx } = await supabaseClient()
    .from('transactions')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!checkTx) {
    return NextResponse.json(
      { message: 'Transaksi tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { data, error } = await supabaseClient()
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: `Status transaksi berhasil diubah menjadi ${status}`,
    data,
    success: true,
  });
}
