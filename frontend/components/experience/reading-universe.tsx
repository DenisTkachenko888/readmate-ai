"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Library,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { books } from "@/lib/data";

type Theme = "dark" | "light";

const nodes = [
  [107, 182], [140, 130], [201, 99], [269, 105], [334, 137], [372, 191],
  [362, 261], [313, 317], [246, 348], [172, 325], [114, 273], [182, 203],
  [243, 166], [300, 211], [255, 273], [193, 263], [238, 224], [315, 162],
] as const;

const edges = [
  [0, 1], [0, 10], [0, 11], [1, 2], [1, 11], [2, 3], [2, 12],
  [3, 4], [3, 12], [4, 5], [4, 17], [5, 6], [5, 13], [6, 7],
  [6, 13], [7, 8], [7, 14], [8, 9], [8, 14], [9, 10],
  [9, 15], [10, 15], [11, 12], [11, 15], [11, 16], [12, 13],
  [12, 16], [12, 17], [13, 14], [13, 16], [14, 15], [14, 16],
  [15, 16], [16, 17], [4, 12], [3, 17],
] as const;

function NeuralSphere() {
  return (
    <div className="rm-sphere" aria-hidden="true">
      <svg className="rm-sphere-svg" viewBox="0 0 480 450" fill="none">
        <defs>
          <radialGradient id="rm-core" cx="45%" cy="38%" r="67%">
            <stop offset="0%" stopColor="#b390ff" stopOpacity=".28" />
            <stop offset="54%" stopColor="#7c46dd" stopOpacity=".14" />
            <stop offset="100%" stopColor="#351b78" stopOpacity=".02" />
          </radialGradient>
          <linearGradient id="rm-links" x1="80" y1="80" x2="410" y2="380">
            <stop stopColor="#e1cbff" stopOpacity=".72" />
            <stop offset=".45" stopColor="#a579ff" stopOpacity=".54" />
            <stop offset="1" stopColor="#6259fb" stopOpacity=".32" />
          </linearGradient>
          <radialGradient id="rm-dots">
            <stop stopColor="#f8ecff" />
            <stop offset="1" stopColor="#b58aff" />
          </radialGradient>
          <filter id="rm-glow">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="rm-circle">
            <circle cx="240" cy="224" r="166" />
          </clipPath>
        </defs>
        <circle cx="240" cy="224" r="171" stroke="currentColor" strokeOpacity=".1" />
        <circle cx="240" cy="224" r="165" fill="url(#rm-core)" />
        <circle cx="240" cy="224" r="162" stroke="#b89bff" strokeOpacity=".22" />
        <g clipPath="url(#rm-circle)">
          <ellipse cx="240" cy="224" rx="157" ry="63" stroke="url(#rm-links)" strokeOpacity=".48" transform="rotate(-27 240 224)" />
          <ellipse cx="240" cy="224" rx="77" ry="166" stroke="url(#rm-links)" strokeOpacity=".36" transform="rotate(25 240 224)" />
          <ellipse cx="240" cy="224" rx="155" ry="100" stroke="url(#rm-links)" strokeOpacity=".28" transform="rotate(44 240 224)" />
          {edges.map(([from, to], index) => (
            <line
              key={index}
              className="rm-link"
              x1={nodes[from][0]}
              y1={nodes[from][1]}
              x2={nodes[to][0]}
              y2={nodes[to][1]}
              stroke="url(#rm-links)"
              strokeWidth={index % 5 === 0 ? "1.6" : ".8"}
            />
          ))}
          {nodes.map(([cx, cy], index) => (
            <g key={index} className="rm-node" style={{ animationDelay: String(index * -.31) + "s" }}>
              <circle cx={cx} cy={cy} r="8" fill="#a36bff" opacity=".27" filter="url(#rm-glow)" />
              <circle cx={cx} cy={cy} r={index % 4 === 0 ? "3.7" : "2.4"} fill="url(#rm-dots)" />
            </g>
          ))}
          <path d="M178 201c32-30 90-30 123 13-18 27-62 43-109 30" stroke="#e5caff" strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 8" />
        </g>
        <ellipse cx="240" cy="225" rx="200" ry="62" stroke="#a07dff" strokeOpacity=".13" transform="rotate(-25 240 225)" />
      </svg>
      <span className="rm-sphere-label rm-sphere-label-left">ИДЕИ</span>
      <span className="rm-sphere-label rm-sphere-label-right">СМЫСЛЫ</span>
    </div>
  );
}

export function ReadingUniverse() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const demoBook = books[0];
  const isLight = theme === "light";

  return (
    <div className={isLight ? "rm-experience rm-experience-light" : "rm-experience rm-experience-dark"}>
      <div className="rm-atmosphere" aria-hidden="true" />
      <section className="rm-hero" aria-labelledby="rm-heading">
        <div className="rm-topline">
          <span className="rm-eyebrow"><span className="rm-live-dot" /> READMATEAI · ИНТЕРАКТИВНАЯ КОНЦЕПЦИЯ</span>
          <button
            type="button"
            className="rm-theme-toggle"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            aria-label={isLight ? "Включить тёмный режим" : "Включить светлый режим"}
            title={isLight ? "Тёмная тема" : "Светлая тема"}
          >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
            <span>{isLight ? "Ночь" : "День"}</span>
          </button>
        </div>
        <div className="rm-hero-grid">
          <div className="rm-copy">
            <p className="rm-kicker"><Sparkles size={15} /> ВАША КНИГА. НОВАЯ ГЛУБИНА.</p>
            <h1 id="rm-heading">Читать — значит <em>открывать вселенные.</em></h1>
            <p className="rm-lead">Книга рождает вопросы. ReadMateAI помогает находить связи, понимать сложное и сохранять самое важное — не отвлекая от самой истории.</p>
            <div className="rm-cta-row">
              <Link href="/" className="rm-primary-action">Открыть библиотеку <ArrowRight size={18} /></Link>
              <button type="button" className="rm-secondary-action" onClick={() => setMenuOpen(true)}>
                Исследовать книгу <BookOpen size={17} />
              </button>
            </div>
            <p className="rm-helper"><ArrowDown size={14} /> Нажмите на книгу, чтобы выбрать режим</p>
          </div>
          <div className="rm-stage">
            <div className="rm-orb-halo" aria-hidden="true" />
            <NeuralSphere />
            <div className="rm-beam" aria-hidden="true" />
            <button
              type="button"
              className="rm-book"
              aria-label="Открыть режимы чтения"
              aria-expanded={menuOpen}
              aria-controls="rm-book-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span className="rm-page rm-page-left">
                <span className="rm-page-lines" />
                <span className="rm-page-lines short" />
                <span className="rm-page-lines" />
                <span className="rm-page-lines mid" />
                <span className="rm-page-lines" />
                <span className="rm-page-lines short" />
              </span>
              <span className="rm-page rm-page-right">
                <span className="rm-book-monogram">R<span>✦</span>M</span>
                <span className="rm-book-title">EVERY STORY<br />UNFOLDS</span>
                <span className="rm-page-rule" />
                <span className="rm-book-hint">ОТКРЫТЬ РЕЖИМЫ</span>
              </span>
              <span className="rm-book-spine" />
            </button>
            {menuOpen && (
              <div className="rm-book-menu" id="rm-book-menu">
                <div className="rm-menu-heading">
                  <span>КНИГА · ДЕМО</span>
                  <button type="button" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">×</button>
                </div>
                <p className="rm-menu-bookname">{demoBook.title}</p>
                <Link href={"/reader?book=" + encodeURIComponent(demoBook.id)} className="rm-menu-item">
                  <BookOpen size={17} /> Читать книгу <ArrowRight size={15} />
                </Link>
                <Link href="/" className="rm-menu-item">
                  <Library size={17} /> Выбрать другую <ArrowRight size={15} />
                </Link>
                <p className="rm-menu-caption">Режимы чтения откроются в существующем приложении. Данные книги демонстрационные.</p>
              </div>
            )}
          </div>
        </div>
        <p className="rm-stage-caption">ВИЗУАЛЬНАЯ МЕТАФОРА: ЗНАНИЯ РОЖДАЮТСЯ ИЗ КНИГ</p>
      </section>
      <section className="rm-philosophy" aria-labelledby="rm-philosophy-heading">
        <p className="rm-section-label">ОДИН ПРОДУКТ · ДВА НАСТРОЕНИЯ</p>
        <h2 id="rm-philosophy-heading">Снаружи — магия. <span>Внутри — тишина.</span></h2>
        <div className="rm-value-grid">
          <div><BrainCircuit size={24} /><h3>Понимание</h3><p>Контекст и идеи возникают вокруг книги, не затмевая её.</p></div>
          <div><BookOpen size={24} /><h3>Чтение</h3><p>В ридере фокус возвращается к тексту и вашему ритму.</p></div>
          <div><Sparkles size={24} /><h3>Открытия</h3><p>Технологии служат истории, а не требуют внимания к себе.</p></div>
        </div>
        <Link href="/" className="rm-bottom-link">Перейти в приложение <ArrowRight size={17} /></Link>
      </section>
      <p className="rm-disclaimer">Экспериментальный лендинг. 3D-сцена стилизована средствами CSS и SVG, без тяжёлого WebGL. Текущая библиотека использует демо-данные.</p>
    </div>
  );
}
