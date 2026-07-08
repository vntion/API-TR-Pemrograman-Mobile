import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar semua pengguna
 *     description: Endpoint ini mengembalikan daftar pengguna yang ada di dalam sistem (dummy data).
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         example: john@example.com
 */
export async function GET() {
  // Simulasi data dari database
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  return NextResponse.json({ success: true, data: users });
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Menambahkan pengguna baru
 *     description: Endpoint ini digunakan untuk membuat pengguna baru.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: New User
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *     responses:
 *       201:
 *         description: Berhasil menambahkan pengguna
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
 *                   example: Pengguna berhasil dibuat
 *       400:
 *         description: Bad Request, parameter tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Name and email are required
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validasi input sederhana
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Simulasi respons insert database
    return NextResponse.json(
      { success: true, message: 'Pengguna berhasil dibuat' },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
