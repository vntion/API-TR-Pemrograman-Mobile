import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/manager/employees:
 *   get:
 *     summary: Get employee list
 *     description: Retrieve a list of employees (non-manager users) with their active status based on today's attendance. Supports search and status filtering. Requires Bearer token authentication and manager role.
 *     tags:
 *       - Manager
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search employees by name (case-insensitive partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *         description: Filter employees by active status based on today's attendance
 *     responses:
 *       200:
 *         description: Successfully retrieved employees
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
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       is_active:
 *                         type: boolean
 *                         description: Whether the employee has attendance today
 *                       status_label:
 *                         type: string
 *                         enum: [Aktif, Tidak Aktif]
 *                 total:
 *                   type: integer
 *                   description: Total number of employees returned
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
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const status = searchParams.get('status'); // 'active', 'inactive', or 'all'

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

  let query = supabaseClient()
    .from('users')
    .select('id, name, role, created_at, updated_at')
    .neq('role', 'manager');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: employees, error } = await query;

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  if (!employees) {
    return NextResponse.json({
      data: [],
      success: true,
    });
  }

  // Check active status based on today's attendance
  const today = new Date().toISOString().split('T')[0];
  const employeeIds = employees.map((e) => e.id);

  const { data: todayAttendances } = await supabaseClient()
    .from('attendances')
    .select('user_id')
    .eq('attendance_date', today)
    .in('user_id', employeeIds);

  const activeUserIds = new Set(todayAttendances?.map((a) => a.user_id) || []);

  const employeesWithStatus = employees.map((emp) => ({
    ...emp,
    is_active: activeUserIds.has(emp.id),
    status_label: activeUserIds.has(emp.id) ? 'Aktif' : 'Tidak Aktif',
  }));

  let filteredEmployees = employeesWithStatus;
  if (status === 'active') {
    filteredEmployees = employeesWithStatus.filter((e) => e.is_active);
  } else if (status === 'inactive') {
    filteredEmployees = employeesWithStatus.filter((e) => !e.is_active);
  }

  return NextResponse.json({
    data: filteredEmployees,
    total: filteredEmployees.length,
    success: true,
  });
}
