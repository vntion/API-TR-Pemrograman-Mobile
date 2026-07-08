'use client';

import SwaggerUI from 'swagger-ui-react';
// @ts-ignore
import 'swagger-ui-react/swagger-ui.css';

type Props = {
  /** Spesifikasi OpenAPI yang di-generate dari anotasi @swagger */
  spec: Record<string, unknown>;
};

/**
 * Komponen client-side yang me-render Swagger UI.
 * Harus berupa Client Component karena swagger-ui-react
 * menggunakan DOM API secara langsung.
 */
export default function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}
