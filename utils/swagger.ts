import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * Menghasilkan spesifikasi OpenAPI dari anotasi @swagger
 * pada semua file API Route di folder app/api.
 */
export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // Membaca file-file API Route di dalam folder app/api
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'KasirKu API',
        version: '1.0.0',
        description:
          'Dokumentasi API interaktif untuk aplikasi KasirKu — sistem Point of Sale (POS). ' +
          'Gunakan endpoint /api/login untuk mendapatkan token autentikasi, lalu masukkan token ' +
          'pada tombol Authorize di atas untuk mengakses endpoint yang dilindungi.',
        contact: {
          name: 'KasirKu Dev Team',
        },
      },
      tags: [
        { name: 'Authentication', description: 'Login, Logout, dan Register' },
        { name: 'Users', description: 'Manajemen data pengguna' },
        { name: 'Categories', description: 'Manajemen kategori menu' },
        { name: 'Menu', description: 'Manajemen menu makanan & minuman' },
        { name: 'Ingredients', description: 'Manajemen bahan baku' },
        { name: 'Transactions', description: 'Manajemen transaksi penjualan' },
        { name: 'Attendances', description: 'Absensi karyawan (check-in/check-out)' },
        { name: 'Manager', description: 'Dashboard & manajemen karyawan (khusus manager)' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Masukkan token yang didapat dari endpoint POST /api/login',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
