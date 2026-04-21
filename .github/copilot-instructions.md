# Project Instruction File

This repository follows these coding and testing conventions for NestJS + Prisma development.

## General TypeScript / Style Rules

- Use LF line endings for all repository files.
- Never use the `any` type.
- Prefer nested `if` statements instead of early returns or guard clauses when explaining control flow.
- Use camelCase for Prisma model fields and PascalCase for Prisma model names.
- Always follow the project commitlint rules: commit messages should match the Angular-style types defined in `commitlint.config.js`.

## Dependency Injection and Services

- Always use constructor-based dependency injection in NestJS classes.
- Avoid manual instantiation of services or providers with `new`.
- For database access, always use the injected `PrismaService`.
- Never create a new `PrismaClient` instance inside a service.

## NestJS and Validation

- Use NestJS decorators for validation and HTTP handling.
- Apply class-validator decorators such as `@IsString`, `@IsInt`, `@IsOptional`, etc. on DTOs.
- Use decorators like `@Body()`, `@Query()`, `@Param()`, `@Get()`, `@Post()`, `@Put()`, `@Delete()` for controller routes.

## Testing Conventions

- Keep unit tests (`*.spec.ts`) co-located with the source file under the same directory.
- Place end-to-end tests (`*.e2e-spec.ts`) in the root `/test` folder.
- Mock external dependencies in unit tests using `jest.mock()` or custom providers.
- External services such as Prisma, HTTP APIs, or third-party SDKs should be mocked in unit tests rather than executed against real systems.

## Suggested Prompt Example

- "Create a NestJS service that uses constructor-based injection for `PrismaService`, validates input with `@IsString` and `@IsInt`, and keeps unit tests co-located with the source file."
- "Write a unit test for a NestJS controller that mocks `PrismaService` with a custom provider and avoids using `any`."
