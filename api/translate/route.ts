import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source_lang = formData.get('source_lang') as string;
    const target_lang = formData.get('target_lang') as string;

    if (!file) {
      return NextResponse.json(
        { detail: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Extrai texto baseado no tipo de arquivo
    let text = '';
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'txt') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      // Para PDF, precisaríamos de uma biblioteca server-side
      // Por enquanto, vamos simular
      text = `[Conteúdo do PDF ${file.name} - Implementar extração PDF]`;
    } else {
      text = `[Conteúdo do arquivo ${file.name}]`;
    }

    // Divide em páginas (simulação)
    const pages = splitIntoPages(text, 1500);
    
    // Traduz cada página com contexto
    const translatedPages = [];
    let context = '';

    for (let i = 0; i < Math.min(pages.length, 10); i++) {
      const translatedPage = await translateWithAI(
        pages[i],
        source_lang,
        target_lang,
        context
      );
      
      translatedPages.push({
        page_number: i + 1,
        original: pages[i],
        translated: translatedPage
      });

      // Atualiza contexto com parte da tradução
      context += `\n--- Página ${i + 1} ---\n${translatedPage}\n`;
    }

    return NextResponse.json({
      filename: file.name,
      total_pages: translatedPages.length,
      pages: translatedPages,
      source_lang,
      target_lang
    });

  } catch (error: any) {
    console.error('Erro na tradução:', error);
    return NextResponse.json(
      { detail: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
}

function splitIntoPages(text: string, charsPerPage: number = 1500): string[] {
  const pages: string[] = [];
  const words = text.split(' ');
  let currentPage: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length + 1 > charsPerPage) {
      pages.push(currentPage.join(' '));
      currentPage = [word];
      currentLength = word.length;
    } else {
      currentPage.push(word);
      currentLength += word.length + 1;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage.join(' '));
  }

  return pages.slice(0, 10); // Máximo 10 páginas
}

async function translateWithAI(
  text: string,
  source_lang: string,
  target_lang: string,
  context: string = ''
): Promise<string> {
  const languageNames: { [key: string]: string } = {
    en: 'inglês',
    es: 'espanhol',
    fr: 'francês',
    de: 'alemão',
    it: 'italiano',
    pt: 'português',
    ja: 'japonês',
    ko: 'coreano',
    zh: 'chinês',
    ru: 'russo'
  };

  const sourceName = languageNames[source_lang] || source_lang;
  const targetName = languageNames[target_lang] || target_lang;

  const prompt = `
Você é um tradutor profissional especializado em tradução de documentos.

CONTEXTO ANTERIOR (para manter consistência):
${context}

TEXTO ORIGINAL (${sourceName}):
${text}

INSTRUÇÕES:
1. Traduza fielmente do ${sourceName} para ${targetName}
2. Mantenha termos técnicos, nomes próprios e formatação
3. Use linguagem natural e fluida
4. Preserve o significado original
5. Mantenha consistência com o contexto fornecido

TRADUÇÃO (${targetName}):
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um tradutor profissional especializado em tradução precisa e contextual de documentos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0]?.message?.content?.trim() || '[Tradução não disponível]';
  } catch (error) {
    console.error('Erro OpenAI:', error);
    return `[Erro na tradução: ${error}]`;
  }
}
