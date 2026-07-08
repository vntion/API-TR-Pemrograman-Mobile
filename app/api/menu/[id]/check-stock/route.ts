import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/menu/{id}/check-stock:
 *   get:
 *     summary: Check stock availability for a menu item
 *     description: Check if all ingredients for a menu item are available in sufficient quantities.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The menu item ID to check stock for.
 *     responses:
 *       200:
 *         description: Stock availability check result.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     menu_id:
 *                       type: integer
 *                     menu_name:
 *                       type: string
 *                     is_available:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                       description: Present when no recipe exists for the menu.
 *                     insufficient_ingredients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ingredient_id:
 *                             type: integer
 *                           ingredient_name:
 *                             type: string
 *                           needed:
 *                             type: number
 *                           available:
 *                             type: number
 *                           unit:
 *                             type: string
 *                     ingredients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ingredient_id:
 *                             type: integer
 *                           ingredient_name:
 *                             type: string
 *                           quantity_needed:
 *                             type: number
 *                           stock_available:
 *                             type: number
 *                           unit:
 *                             type: string
 *                           is_enough:
 *                             type: boolean
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Menu item not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menu tidak ditemukan
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const { data: menu } = await supabaseClient()
    .from('menus')
    .select('id, name')
    .eq('id', id)
    .single();

  if (!menu) {
    return NextResponse.json(
      { message: 'Menu tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { data: recipe } = await supabaseClient()
    .from('menu_ingredients')
    .select('ingredient_id, quantity_needed, ingredients(id, name, stock_quantity, unit)')
    .eq('menu_id', id);

  if (!recipe || recipe.length === 0) {
    return NextResponse.json({
      data: {
        menu_id: Number(id),
        menu_name: menu.name,
        is_available: true,
        message: 'Tidak ada resep bahan baku untuk menu ini',
        ingredients: [],
      },
      success: true,
    });
  }

  const insufficientIngredients = [];
  let isAvailable = true;

  for (const r of recipe) {
    const ingredient = r.ingredients as { id: number; name: string; stock_quantity: number; unit: string } | null;
    if (!ingredient) continue;

    const isEnough = ingredient.stock_quantity >= r.quantity_needed;
    if (!isEnough) {
      isAvailable = false;
      insufficientIngredients.push({
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        needed: r.quantity_needed,
        available: ingredient.stock_quantity,
        unit: ingredient.unit,
      });
    }
  }

  return NextResponse.json({
    data: {
      menu_id: Number(id),
      menu_name: menu.name,
      is_available: isAvailable,
      insufficient_ingredients: insufficientIngredients,
      ingredients: recipe.map((r) => {
        const ing = r.ingredients as { id: number; name: string; stock_quantity: number; unit: string } | null;
        return {
          ingredient_id: r.ingredient_id,
          ingredient_name: ing?.name,
          quantity_needed: r.quantity_needed,
          stock_available: ing?.stock_quantity,
          unit: ing?.unit,
          is_enough: (ing?.stock_quantity || 0) >= r.quantity_needed,
        };
      }),
    },
    success: true,
  });
}
