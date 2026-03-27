import { Elysia, t } from "elysia";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return result;
      } catch (error: any) {
        if (error.message === "Email sudah terdaftar") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal" };
      }
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 255 }),
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      detail: {
        tags: ["Users API"],
        summary: "Registrasi Pengguna Baru",
        description: "Mendaftarkan pengguna baru ke sistem database.",
      },
      response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUser(body);
        return { data: token };
      } catch (error: any) {
        if (error.message === "Email atau password salah") {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal" };
      }
    },
    {
      body: t.Object({
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
      detail: {
        tags: ["Users API"],
        summary: "Login Pengguna",
        description: "Autentikasi pengguna dan mengembalikan token sesi.",
      },
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .derive(({ headers }) => {
    const authorization = headers["authorization"];
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { token: null };
    }

    const token = authorization.split(" ")[1];
    return { token };
  })
  .get(
    "/current",
    async ({ token, set }) => {
      try {
        if (!token) {
          throw new Error("Unauthorized");
        }

        const result = await getCurrentUser(token);
        return { data: result };
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal" };
      }
    },
    {
      detail: {
        tags: ["Users API"],
        summary: "Get Current User Profile",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            createdAt: t.Any(),
          }),
        }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .delete(
    "/logout",
    async ({ token, set }) => {
      try {
        if (!token) {
          throw new Error("Unauthorized");
        }

        const result = await logoutUser(token);
        return { data: result };
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal" };
      }
    },
    {
      detail: {
        tags: ["Users API"],
        summary: "Logout User",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  );
