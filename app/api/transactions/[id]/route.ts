import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve a single transaction by its ID, including user info and transaction details with menu info. Requires Bearer token authentication.
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
 *     responses:
 *       200:
 *         description: Successfully retrieved transaction
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
 *                     payment_method:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, cancelled]
 *                     subtotal:
 *                       type: number
 *                     tax_amount:
 *                       type: number
 *                     total_amount:
 *                       type: number
 *                     user_id:
 *                       type: integer
 *                     transactions_date:
 *                       type: string
 *                       format: date-time
 *                     users:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           transaction_id:
 *                             type: integer
 *                           menu_id:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           quantity:
 *                             type: integer
 *                           subtotal:
 *                             type: number
 *                           menus:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               image_url:
 *                                 type: string
 *                 success:
 *                   type: boolean
 *                   example: true
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
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const { data: transaction, error } = await supabaseClient()
    .from('transactions')
    .select('*, users(id, name, role)')
    .eq('id', id)
    .single();

  if (!transaction) {
    return NextResponse.json(
      { message: 'Transaksi tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { data: details } = await supabaseClient()
    .from('transaction_details')
    .select('*, menus(id, name, price, image_url)')
    .eq('transaction_id', id);

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { ...transaction, details },
    success: true,
  });
}
