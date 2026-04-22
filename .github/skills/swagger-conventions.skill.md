---
name: swagger-conventions
description: 'Define and apply Swagger/OpenAPI documentation standards for the repository.'
metadata:
  applyTo:
    - 'src/**/*.ts'
    - '.github/skills/swagger-conventions.skill.md'
  keywords:
    - swagger
    - openapi
    - api-docs
    - nestjs
    - documentation
  verification:
    command: npm run test:e2e
    description: Verify Swagger UI is reachable and renders successfully via end-to-end tests.
---

# Swagger Documentation Conventions

This skill defines the standards for implementing OpenAPI (Swagger) documentation in the Advance-Stock-Price-Ckecker repository to ensure a consistent and high-quality developer experience.

## General Principles

- **Class-Based DTOs**: Never use TypeScript interfaces for request bodies or response objects. Swagger requires classes with decorators to generate metadata at runtime.
- **Layered Documentation**: Every controller and its endpoints must be fully documented.
- **Domain-Based Tagging**: Use `@ApiTags` at the class level to group endpoints by their primary business entity (e.g., `stock`, `user`). Use lowercase for tag names.

## Controller Standards

Every controller method must include:

1.  **@ApiOperation**: Provide a concise `summary` (e.g., "Get current stock price").
2.  **@ApiParam**: Document all path parameters with a name and a meaningful description/example.
3.  **@ApiResponse**: 
    - Document the success case (200, 201).
    - Link the `type` to the corresponding DTO class.
    - Document common error cases (400, 401, 404, 500) where applicable.

Example:
```typescript
@ApiTags('stock')
@Controller('stock')
export class StockController {
  @ApiOperation({ summary: 'Summary of the action' })
  @ApiResponse({ status: 200, type: SuccessDto })
  @Get(':id')
  getAction(@Param('id') id: string) {}
}
```

## DTO Standards

Every property in a DTO class must include `@ApiProperty()` with the following options:

- **description**: A clear, human-readable explanation of the field.
- **example**: A realistic value for the field.
- **required**: Explicitly set if the field is optional.
- **format/type**: Use for dates, UUIDs, or specific numeric types if not automatically inferred.

Example:
```typescript
export class StockPriceResponse {
  @ApiProperty({ description: 'The stock symbol', example: 'AAPL' })
  symbol: string;
}
```

## Verification

- Ensure `SwaggerModule` is configured in `main.ts` at the `/api` path.
- Run `npm run test:e2e` to verify the Swagger UI route (`/api`) is reachable and returns HTML.
- Run `npm run typecheck` to ensure no circular dependencies were introduced by DTO imports.
