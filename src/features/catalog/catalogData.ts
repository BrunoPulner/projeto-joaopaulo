export type Category = {
  id: string;
  name: string;
  video?: string;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  video?: string;
};

export type Product = {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  name: string;
  description: string;
  ingredients?: string[];
  price: number;
  image?: string;
};

export const categories: Category[] = [
  { id: "espetinhos", name: "Espetinhos", video: "/video/espetin.mp4" },
  { id: "lanches", name: "Lanches", video: "/video/hamburguer.mp4" },
  { id: "pasteis", name: "Pastéis", video: "/video/pastel.mp4" },
  
  { id: "pizzas", name: "Pizzas", video: "/video/pizza.mp4" },
  { id: "bebidas", name: "Bebidas", video: "/video/coca.mp4" },
];

export const subcategories: Subcategory[] = [
  {
    id: "espetinho-salgado",
    categoryId: "espetinhos",
    name: "Salgados",
  },
  {
    id: "espetinho-doce",
    categoryId: "espetinhos",
    name: "Doces",
  },

  {
    id: "lanche",
    categoryId: "lanches",
    name: "Lanches",
  },

  {
    id: "pastel-salgado",
    categoryId: "pasteis",
    name: "Salgados",
  },
  {
    id: "pastel-doce",
    categoryId: "pasteis",
    name: "Doces",
  },
  {
    id: "pizza-salgada",
    categoryId: "pizzas",
    name: "Salgadas",
  },
  {
    id: "pizza-doce",
    categoryId: "pizzas",
    name: "Doces",
  },

  {
    id: "bebida-nao-alcoolica",
    categoryId: "bebidas",
    name: "Não alcoólicas",
  },
  {
    id: "bebida-alcoolica",
    categoryId: "bebidas",
    name: "Alcoólicas",
    video: "/video/heineken.mp4",
  },
];

export const products: Product[] = [
  {
    id: "espetinho-coracao",
    categoryId: "espetinhos",
    subcategoryId: "espetinho-salgado",
    name: "Espetinho de coração",
    description: "Espetinho de coração preparado na brasa.",

    price: 9,
  },
  {
    id: "pizza-calabresa",
    categoryId: "pizzas",
    subcategoryId: "pizza-salgada",
    name: "Pizza de calabresa",
    description: "Confira os ingredientes antes de finalizar o cardápio.",
    price: 50,
  },
  {
    id: "pizza-alcatra",
    categoryId: "pizzas",
    subcategoryId: "pizza-salgada",
    name: "Pizza de alcatra",
    description: "Confira os ingredientes antes de finalizar o cardápio.",
    price: 60,
  },
  {
  id: "x-bacon",
  categoryId: "lanches",
  subcategoryId: "lanche",
  name: "X-Bacon",
  description: "Hambúrguer preparado na chapa.",
  ingredients: [
    "Pão",
    "Hambúrguer",
    "Queijo",
    "Bacon",
    "Alface",
    "Tomate",
  ],
  price: 25,
}
];