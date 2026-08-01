export interface ReaderBook {
  id: string;
  title: string;
  author: string;
  chapters: {
    title: string;
    content: string;
  }[];
  contextTitle?: string;
  contextIcon?: string;
  contextItems?: {
    title: string;
    description: string;
  }[];
}

export const readerBooks: ReaderBook[] = [
  {
    id: "book-1",
    title: "Мастер и Маргарита",
    author: "Михаил Булгаков",
    contextTitle: "Персонажи и сюжет",
    contextIcon: "users",
    contextItems: [
      {
        title: "Михаил Берлиоз",
        description:
          "Председатель Массолита, редактор журнала. Первая жертва Воланда — погибает под трамваем.",
      },
      {
        title: "Иван Бездомный",
        description:
          "Поэт, свидетель появления Воланда. После встречи с ним попадает в психиатрическую клинику.",
      },
      {
        title: "Воланд",
        description:
          "Князь тьмы, посетивший Москву для проведения «великого бала у сатаны». Наблюдает и наказывает.",
      },
      {
        title: "Мастер",
        description:
          "Историк, написавший роман о Понтии Пилате. Сожёг рукопись и находится в клинике.",
      },
      {
        title: "Маргарита",
        description:
          "Возлюбленная Мастера. Заключает сделку с Воландом, чтобы спасти Мастера.",
      },
      {
        title: "Понтий Пилат",
        description:
          "Прокуратор Иудеи, осудивший Иешуа Га-Ноцри на казнь. Тема нравственного выбора.",
      },
    ],
    chapters: [
      {
        title: "Глава 1. Не стоит ходить в гости к незнакомцам",
        content: `Однажды весною, в час небывало жаркого заката, в Москве, на Патриарших прудах, появились два гражданина. Первый из них, одетый в летнюю серую пару, был маленького роста, упитан, лыс, свою приличную шляпу пирожком нёс в руке, а на хорошо выбритом лице его помещались очки сверхъестественных размеров в чёрной роговой оправе. Второй — плечистый, рыжеватый, вихрастый молодой человек в заломленной на затылок клетчатой кепке — был в ковбойке, жеваных белых брюках и в чёрных тапочках.

Первым был не кто иной, как Михаил Александрович Берлиоз, председатель правления одной из крупнейших московских литературных ассоциаций, сокращённо именуемой Массолит, и редактор толстого художественного журнала, а молодой спутник его — поэт Иван Николаевич Понырёв, писавший под псевдонимом Бездомный.

Попав в тень чуть зеленеющих лип, писатели первым долгом бросились к пёстро раскрашенной будочке с надписью «Пиво и воды». Да, следует отметить первую странность этого страшного майского вечера. Не только у будочки, но и во всей аллее, параллельно Малой Бронной, не оказалось ни одного человека. В тот час, когда уже, кажется, и сил не было дышать, когда солнце, раскалив Москву, в сухом тумане валилось куда-то за Садовое кольцо, — никто не пришёл под липы, никто не сел на скамейку, пуста была аллея.`,
      },
      {
        title: "Глава 2. Понтий Пилат",
        content: `В белом плаще с кровавым подбоем, шаркающей кавалерийской походкой, ранним утром четырнадцатого числа весеннего месяца нисана в крытую колоннаду между двумя крыльями дворца Ирода Великого вышел прокуратор Иудеи Понтий Пилат.

Более всего на свете прокуратор ненавидел запах розового масла, и всё предвещало теперь нехороший день, так как запах этот начал преследовать прокуратора с рассвета. Прокуратору казалось, что розовый запах источают кипарисы и пальмы в саду, что к запаху кожи и конвоя примешивается проклятая розовая струя. От флигелей в тылу дворца, где расположилась прибывшая с прокуратором в Ершалаим первая когорта двенадцатого молниеносного легиона, заносило дымком в колоннаду, и к нему также примешивался всё тот же жирный розовый дух. О боги, боги, за что вы наказываете меня?`,
      },
    ],
  },
  {
    id: "book-2",
    title: "Clean Code",
    author: "Robert C. Martin",
    contextTitle: "Ключевые принципы",
    contextIcon: "code",
    contextItems: [
      {
        title: "Чистый код",
        description:
          "Код, который легко читать, понимать и изменять. Основная цель — уменьшить сложность.",
      },
      {
        title: "Принцип единственной ответственности (SRP)",
        description:
          "Класс или функция должны иметь только одну причину для изменения.",
      },
      {
        title: "Осмысленные имена",
        description:
          "Имена переменных, функций и классов должны раскрывать намерение. Без комментариев.",
      },
      {
        title: "Закон Деметры",
        description:
          "Объект не должен знать о внутренней структуре других объектов. Минимум связей.",
      },
      {
        title: "DRY (Don't Repeat Yourself)",
        description:
          "Избегайте дублирования кода. Каждая часть знания должна иметь единственное представление.",
      },
      {
        title: "Обработка ошибок",
        description:
          "Используйте исключения вместо кодов возврата. Не возвращайте null.",
      },
    ],
    chapters: [
      {
        title: "Глава 1. Clean Code",
        content: `You are reading this book for two reasons. First, you are a programmer. Second, you want to be a better programmer. Good. We need better programmers.

This book is about good programming. It is filled with code. We are going to look at code from every possible direction. We will look at it from the top down, from the bottom up, and from the inside out. By the time we are done, we are going to know a lot about code. What's more, we are going to be able to tell the difference between good code and bad code. We will know how to write good code. And we will know how to transform bad code into good code.

Consider this book as a description of the Object Mentor School of Clean Code. The techniques and teachings within are the way that we practice our art. We are willing to claim that if you follow the teachings within this book, you will enjoy the benefits that we have enjoyed: the ability to produce code that is readable, maintainable, and efficient. You will also enjoy the satisfaction of knowing that you are writing code that matters.`,
      },
      {
        title: "Глава 2. Meaningful Names",
        content: `Names are everywhere in software. We name our variables, our functions, our arguments, classes, and packages. We name our source files and the directories that contain them. We name our jar files, war files, and ear files. We name and name and name. Because we do so much of it, we'd better do it well.

The name of a variable, function, or class, should answer all the big questions. It should tell you why it exists, what it does, and how it is used. If a name requires a comment, then the name does not reveal its intent.

The name should be descriptive enough that you don't need to read the implementation to understand what it does. Good names are a sign of clean code. They make the code self-documenting and reduce the need for comments.`,
      },
    ],
  },
  {
    id: "book-3",
    title: "Краткая история времени",
    author: "Стивен Хокинг",
    contextTitle: "Ключевые теории",
    contextIcon: "globe",
    contextItems: [
      {
        title: "Теория относительности",
        description:
          "Пространство и время образуют единый четырёхмерный континуум. Гравитация — искривление пространства-времени.",
      },
      {
        title: "Расширение Вселенной",
        description:
          "Галактики удаляются друг от друга. Чем дальше — тем быстрее. Вселенная началась с сингулярности.",
      },
      {
        title: "Большой взрыв",
        description:
          "Около 13,8 млрд лет назад вся материя была сжата в бесконечно малую точку — сингулярность.",
      },
      {
        title: "Чёрные дыры",
        description:
          "Области пространства-времени, где гравитация настолько сильна, что ничто не может покинуть их.",
      },
      {
        title: "Стрела времени",
        description:
          "Время движется только вперёд (термодинамическая, космологическая и психологическая стрелы).",
      },
      {
        title: "Теория всего",
        description:
          "Поиск единой теории, объединяющей общую теорию относительности и квантовую механику.",
      },
    ],
    chapters: [
      {
        title: "Глава 1. Наша картина Вселенной",
        content: `Когда-то, в глубокой древности, люди задавались вопросом: как устроен мир вокруг нас? Они смотрели на звёздное небо и пытались понять, что представляют собой эти мерцающие огоньки. Сегодня мы знаем, что Вселенная гораздо обширнее и сложнее, чем могли себе представить наши предки.

Согласно теории относительности Эйнштейна, пространство и время не являются абсолютными и независимыми. Они образуют единый четырехмерный континуум — пространство-время. Массивные объекты, такие как звёзды и планеты, искривляют пространство-время вокруг себя, и именно это искривление мы воспринимаем как гравитацию.

Одним из самых удивительных открытий современной космологии стало то, что Вселенная расширяется. Галактики удаляются друг от друга, и чем дальше они находятся, тем быстрее удаляются. Это означает, что когда-то, около 13,8 миллиардов лет назад, вся материя во Вселенной была сжата в бесконечно малую точку — сингулярность.`,
      },
    ],
  },
];

export function getReaderBook(id: string): ReaderBook | undefined {
  return readerBooks.find((b) => b.id === id);
}
