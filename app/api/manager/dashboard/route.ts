import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/manager/dashboard:
 *   get:
 *     summary: Get manager dashboard data
 *     description: Retrieve today's dashboard summary including sales totals, transaction counts by status, and transaction list. Requires Bearer token authentication and manager role.
 *     tags:
 *       - Manager
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     today_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-07-08"
 *                     total_sales:
 *                       type: number
 *                       description: Sum of total_amount for completed transactions today
 *                       example: 550000
 *                     total_transactions:
 *                       type: integer
 *                       example: 15
 *                     completed_transactions:
 *                       type: integer
 *                       example: 10
 *                     pending_transactions:
 *                       type: integer
 *                       example: 3
 *                     cancelled_transactions:
 *                       type: integer
 *                       example: 2
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           payment_method:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, cancelled]
 *                           subtotal:
 *                             type: number
 *                           tax_amount:
 *                             type: number
 *                           total_amount:
 *                             type: number
 *                           user_id:
 *                             type: integer
 *                           transactions_date:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           users:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               role:
 *                                 type: string
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
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];

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

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  // Get today's transactions
  const { data: todayTransactions, error } = await supabaseClient()
    .from('transactions')
    .select('*, users(id, name, role)')
    .gte('transactions_date', startOfDay)
    .lt('transactions_date', endOfDay)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  // Calculate totals
  const totalSales = todayTransactions?.reduce((sum, tx) => {
    if (tx.status === 'completed') {
      return sum + tx.total_amount;
    }
    return sum;
  }, 0) || 0;

  const totalTransactions = todayTransactions?.length || 0;
  const completedTransactions = todayTransactions?.filter((tx) => tx.status === 'completed').length || 0;
  const pendingTransactions = todayTransactions?.filter((tx) => tx.status === 'pending').length || 0;
  const cancelledTransactions = todayTransactions?.filter((tx) => tx.status === 'cancelled').length || 0;

  return NextResponse.json({
    data: {
      today_date: today.toISOString().split('T')[0],
      total_sales: totalSales,
      total_transactions: totalTransactions,
      completed_transactions: completedTransactions,
      pending_transactions: pendingTransactions,
      cancelled_transactions: cancelledTransactions,
      transactions: todayTransactions,
    },
    success: true,
  });
}
