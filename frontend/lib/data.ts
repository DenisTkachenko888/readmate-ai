export interface Chapter {
  title: string;
  pages: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  category: string;
  progress: number;
  description: string;
  chapters: Chapter[];
}

export interface AIInsight {
  id: string;
  text: string;
  bookTitle: string;
}

export const categories = [
  "Художественная",
  "Программирование",
  "Наука",
  "Бизнес",
] as const;

export const books: Book[] = [
  {
    id: "book-1",
    title: "Мастер и Маргарита",
    author: "Михаил Булгаков",
    coverColor: "from-purple-600 to-pink-600",
    category: "Художественная",
    progress: 45,
    description:
      "Роман, в котором переплетаются две сюжетные линии: визит Сатаны в Москву 1930-х годов и история любви Мастера и Маргариты.",
    chapters: [
      { title: "Глава 1. Не стоит ходить в гости к незнакомцам", pages: 14 },
      { title: "Глава 2. Понтий Пилат", pages: 18 },
      { title: "Глава 3. Седьмое доказательство", pages: 10 },
      { title: "Глава 4. Погоня", pages: 12 },
      { title: "Глава 5. Дело было в Грибоедове", pages: 16 },
    ],
  },
  {
    id: "book-2",
    title: "Clean Code",
    author: "Robert C. Martin",
    coverColor: "from-blue-600 to-cyan-600",
    category: "Программирование",
    progress: 72,
    description:
      "Классическое руководство по написанию чистого, поддерживаемого и эффективного кода.",
    chapters: [
      { title: "Глава 1. Clean Code", pages: 18 },
      { title: "Глава 2. Meaningful Names", pages: 12 },
      { title: "Глава 3. Functions", pages: 22 },
      { title: "Глава 4. Comments", pages: 14 },
      { title: "Глава 5. Formatting", pages: 16 },
    ],
  },
  {
    id: "book-3",
    title: "Краткая история времени",
    author: "Стивен Хокинг",
    coverColor: "from-indigo-700 to-slate-800",
    category: "Наука",
    progress: 30,
    description:
      "Книга, в которой Стивен Хокинг объясняет сложнейшие концепции космологии простым и увлекательным языком.",
    chapters: [
      { title: "Глава 1. Наша картина Вселенной", pages: 10 },
      { title: "Глава 2. Пространство и время", pages: 16 },
      { title: "Глава 3. Расширяющаяся Вселенная", pages: 14 },
      { title: "Глава 4. Принцип неопределённости", pages: 12 },
      { title: "Глава 5. Элементарные частицы", pages: 18 },
    ],
  },
  {
    id: "book-4",
    title: "От нуля к единице",
    author: "Питер Тиль",
    coverColor: "from-emerald-600 to-teal-600",
    category: "Бизнес",
    progress: 88,
    description:
      "Манифест предпринимателя: как создавать стартапы, которые меняют мир, и почему монополия — это благо.",
    chapters: [
      { title: "Глава 1. Будущее", pages: 8 },
      { title: "Глава 2. Как из 1999-го", pages: 12 },
      { title: "Глава 3. Всё, что было впереди, уже позади", pages: 14 },
      { title: "Глава 4. Идеология конкурентной борьбы", pages: 10 },
      { title: "Глава 5. Первое, что нужно знать об инновациях", pages: 16 },
    ],
  },
  {
    id: "book-5",
    title: "Преступление и наказание",
    author: "Ф.М. Достоевский",
    coverColor: "from-red-800 to-amber-900",
    category: "Художественная",
    progress: 15,
    description:
      "Психологический роман о студенте Раскольникове, который решает убить старуху-процентщицу, чтобы проверить свою теорию.",
    chapters: [
      { title: "Часть I. Глава 1", pages: 20 },
      { title: "Часть I. Глава 2", pages: 18 },
      { title: "Часть I. Глава 3", pages: 16 },
      { title: "Часть I. Глава 4", pages: 22 },
      { title: "Часть I. Глава 5", pages: 14 },
    ],
  },
  {
    id: "book-6",
    title: "Design Patterns",
    author: "Gang of Four",
    coverColor: "from-orange-600 to-red-600",
    category: "Программирование",
    progress: 60,
    description:
      "Библия объектно-ориентированного проектирования: 23 паттерна для решения типовых задач разработки.",
    chapters: [
      { title: "Глава 1. Introduction", pages: 16 },
      { title: "Глава 2. Creational Patterns", pages: 24 },
      { title: "Глава 3. Structural Patterns", pages: 28 },
      { title: "Глава 4. Behavioral Patterns", pages: 32 },
      { title: "Глава 5. Conclusion", pages: 10 },
    ],
  },
  {
    id: "book-7",
    title: "Эгоистичный ген",
    author: "Ричард Докинз",
    coverColor: "from-green-700 to-lime-700",
    category: "Наука",
    progress: 25,
    description:
      "Революционный взгляд на эволюцию: гены — главные действующие лица, а организмы — лишь машины для их выживания.",
    chapters: [
      { title: "Глава 1. Почему существуют люди?", pages: 12 },
      { title: "Глава 2. Репликаторы", pages: 16 },
      { title: "Глава 3. Бессмертные спирали", pages: 14 },
      { title: "Глава 4. Генная машина", pages: 18 },
      { title: "Глава 5. Агрессия", pages: 10 },
    ],
  },
  {
    id: "book-8",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    coverColor: "from-amber-600 to-yellow-600",
    category: "Бизнес",
    progress: 42,
    description:
      "Книга нобелевского лауреата о двух системах мышления — быстрой интуитивной и медленной рациональной.",
    chapters: [
      { title: "Part I. Two Systems", pages: 20 },
      { title: "Part II. Heuristics and Biases", pages: 24 },
      { title: "Part III. Overconfidence", pages: 18 },
      { title: "Part IV. Choices", pages: 22 },
      { title: "Part V. Two Selves", pages: 16 },
    ],
  },
  {
    id: "book-9",
    title: "1984",
    author: "Джордж Оруэлл",
    coverColor: "from-gray-700 to-slate-900",
    category: "Художественная",
    progress: 90,
    description:
      "Антиутопия о тоталитарном обществе, где Большой Брат следит за каждым шагом граждан.",
    chapters: [
      { title: "Часть 1. Глава 1", pages: 14 },
      { title: "Часть 1. Глава 2", pages: 12 },
      { title: "Часть 1. Глава 3", pages: 10 },
      { title: "Часть 1. Глава 4", pages: 16 },
      { title: "Часть 1. Глава 5", pages: 18 },
    ],
  },
  {
    id: "book-10",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    coverColor: "from-violet-600 to-purple-600",
    category: "Программирование",
    progress: 35,
    description:
      "Набор практических советов и методик для программистов, стремящихся стать лучше в своём деле.",
    chapters: [
      { title: "Chapter 1. A Pragmatic Philosophy", pages: 14 },
      { title: "Chapter 2. A Pragmatic Approach", pages: 18 },
      { title: "Chapter 3. The Basic Tools", pages: 16 },
      { title: "Chapter 4. Pragmatic Paranoia", pages: 12 },
      { title: "Chapter 5. Bend or Break", pages: 20 },
    ],
  },
];

export const recentlyReadIds = [
  "book-1",
  "book-2",
  "book-8",
  "book-9",
  "book-4",
];

export const aiInsights: AIInsight[] = [
  {
    id: "insight-1",
    text: "Продолжите чтение «Мастер и Маргарита» — глава 13 ждёт вас. Воланд на пороге!",
    bookTitle: "Мастер и Маргарита",
  },
  {
    id: "insight-2",
    text: "В «Clean Code» вы на 72%. Осталось всего 3 главы до финала!",
    bookTitle: "Clean Code",
  },
  {
    id: "insight-3",
    text: "В «От нуля к единице» Тиль объясняет, почему монополия — это благо. Рекомендуем дочитать.",
    bookTitle: "От нуля к единице",
  },
];
