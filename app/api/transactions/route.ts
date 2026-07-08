import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a list of all transactions with their transaction details. Requires Bearer token authentication.
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved transactions
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
 *                       payment_method:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, cancelled]
 *                       subtotal:
 *                         type: number
 *                       tax_amount:
 *                         type: number
 *                       total_amount:
 *                         type: number
 *                       user_id:
 *                         type: integer
 *                       transactions_date:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       transaction_details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             transaction_id:
 *                               type: integer
 *                             menu_id:
 *                               type: integer
 *                             price:
 *                               type: number
 *                             quantity:
 *                               type: integer
 *                             subtotal:
 *                               type: number
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
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET() {
  const { data: transactions, error } = await supabaseClient().from(
    'transactions',
  ).select(`
      *,
      transaction_details (*)
    `);

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: transactions, success: true });
}

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new transaction with details. Validates ingredient stock before processing and deducts stock quantities upon success. Requires Bearer token authentication.
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *               - status
 *               - subtotal
 *               - tax_amount
 *               - total_amount
 *               - user_id
 *               - details
 *             properties:
 *               payment_method:
 *                 type: string
 *                 example: cash
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 example: pending
 *               subtotal:
 *                 type: number
 *                 example: 50000
 *               tax_amount:
 *                 type: number
 *                 example: 5000
 *               total_amount:
 *                 type: number
 *                 example: 55000
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menu_id
 *                     - price
 *                     - quantity
 *                     - subtotal
 *                   properties:
 *                     menu_id:
 *                       type: integer
 *                       example: 1
 *                     price:
 *                       type: number
 *                       example: 25000
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     subtotal:
 *                       type: number
 *                       example: 50000
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transaction:
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
 *       400:
 *         description: Insufficient ingredient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Gagal: Stok bahan Kopi hanya tersisa 5, tidak cukup untuk pesanan ini."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_method,
      status,
      subtotal,
      tax_amount,
      total_amount,
      user_id,
      details,
    } = body;

    for (const detail of details) {
      const { data: menuIngredients, error: menuIngredientsError } =
        await supabaseClient()
          .from('menu_ingredients')
          .select('ingredient_id, quantity_needed')
          .eq('menu_id', detail.menu_id);

      if (menuIngredientsError) throw menuIngredientsError;

      if (menuIngredients && menuIngredients.length > 0) {
        for (const item of menuIngredients) {
          const totalDeduction = item.quantity_needed * detail.quantity;

          const { data: currentIngredient, error: fetchIngredientError } =
            await supabaseClient()
              .from('ingredients')
              .select('stock_quantity, name')
              .eq('id', item.ingredient_id)
              .single();

          if (fetchIngredientError) throw fetchIngredientError;

          if (currentIngredient.stock_quantity < totalDeduction) {
            return NextResponse.json(
              {
                error: `Gagal: Stok bahan ${currentIngredient.name} hanya tersisa ${currentIngredient.stock_quantity}, tidak cukup untuk pesanan ini.`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    const { data: transaction, error: transactionError } =
      await supabaseClient()
        .from('transactions')
        .insert({
          payment_method,
          status,
          subtotal,
          tax_amount,
          total_amount,
          user_id,
        })
        .select()
        .single();

    if (transactionError) throw transactionError;

    const detailsToInsert = details.map((detail: Record<string, unknown>) => ({
      transaction_id: transaction.id,
      menu_id: detail.menu_id,
      price: detail.price,
      quantity: detail.quantity,
      subtotal: detail.subtotal,
    }));

    const { error: detailsError } = await supabaseClient()
      .from('transaction_details')
      .insert(detailsToInsert);

    if (detailsError) throw detailsError;

    for (const detail of details) {
      const { data: menuIngredients } = await supabaseClient()
        .from('menu_ingredients')
        .select('ingredient_id, quantity_needed')
        .eq('menu_id', detail.menu_id);

      if (menuIngredients && menuIngredients.length > 0) {
        for (const item of menuIngredients) {
          const totalDeduction = item.quantity_needed * detail.quantity;

          const { data: currentIngredient } = await supabaseClient()
            .from('ingredients')
            .select('stock_quantity')
            .eq('id', item.ingredient_id)
            .single();

          if (currentIngredient) {
            const newStock = currentIngredient.stock_quantity - totalDeduction;

            await supabaseClient()
              .from('ingredients')
              .update({ stock_quantity: newStock })
              .eq('id', item.ingredient_id);
          }
        }
      }
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
