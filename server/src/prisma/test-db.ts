import { db } from "./db.js";

async function testDatabase() {
  try {
    console.log("🔥 Cadastrando categoria de teste...");

    const category = await db.orm.public.Category.create({
      name: "Espetinhos",
      slug: "espetinhos",
      description: "Espetinhos preparados na brasa.",
      imageUrl: null,
      isActive: true,
      sortOrder: 1,
    });

    console.log("✅ Categoria cadastrada:", category);
  } catch (error) {
    console.error("❌ Erro ao cadastrar categoria:", error);
  } finally {
    await db.close();
  }
}

testDatabase();