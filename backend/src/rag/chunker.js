"use strict";

const { RagError } = require("./errors");
const { estimateTokens, normalizeText } = require("./text-normalizer");

function splitSections(text) {
    const lines = text.split("\n");
    const sections = [];
    let heading = null;
    let buffer = [];
    const flush = () => {
        const content = buffer.join("\n").trim();
        if (content) sections.push({ heading, content });
        buffer = [];
    };
    for (const line of lines) {
        if (/^#{1,6}\s+/.test(line)) {
            flush();
            heading = line.replace(/^#{1,6}\s+/, "").trim();
        } else {
            buffer.push(line);
        }
    }
    flush();
    return sections.length ? sections : [{ heading: null, content: text }];
}

function splitLongText(text, maxTokens) {
    const paragraphs = text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
    const pieces = [];
    let current = "";
    for (const paragraph of paragraphs.length ? paragraphs : [text]) {
        const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
        if (current && estimateTokens(candidate) > maxTokens) {
            pieces.push(current);
            current = paragraph;
            continue;
        }
        current = candidate;
    }
    if (current) pieces.push(current);
    return pieces.flatMap((piece) => {
        if (estimateTokens(piece) <= maxTokens) return [piece];
        const sentences = piece.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
        const result = [];
        let currentSentence = "";
        for (const sentence of sentences.length ? sentences : [piece]) {
            const candidate = currentSentence ? `${currentSentence} ${sentence}` : sentence;
            if (currentSentence && estimateTokens(candidate) > maxTokens) {
                result.push(currentSentence);
                currentSentence = sentence;
            } else {
                currentSentence = candidate;
            }
        }
        if (currentSentence) result.push(currentSentence);
        return result;
    });
}

function chunkDocument(input, options = {}) {
    const text = normalizeText(input?.text ?? input);
    const maxTokens = Number.isInteger(options.maxTokens) ? options.maxTokens : 600;
    const minTokens = Number.isInteger(options.minTokens) ? options.minTokens : 80;
    const overlapTokens = Number.isInteger(options.overlapTokens) ? options.overlapTokens : Math.floor(maxTokens * 0.15);
    if (maxTokens <= 0 || minTokens <= 0 || minTokens > maxTokens || overlapTokens < 0 || overlapTokens >= maxTokens) {
        throw new RagError("CHUNK_CONFIG_INVALID", "Configuração de chunking inválida.");
    }
    const chunks = [];
    let index = 0;
    for (const section of splitSections(text)) {
        const pieces = splitLongText(section.content, maxTokens);
        for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
            const piece = pieces[pieceIndex];
            const previous = pieceIndex > 0 ? pieces[pieceIndex - 1] : null;
            const overlap = previous && overlapTokens > 0 ? previous.slice(Math.max(0, previous.length - overlapTokens * 4)) : "";
            const body = overlap ? `${overlap}\n\n${piece}` : piece;
            const rawContent = section.heading ? `${section.heading}\n\n${body}` : body;
            const content = estimateTokens(rawContent) <= maxTokens ? rawContent : rawContent.slice(0, maxTokens * 4).trim();
            const tokens = estimateTokens(content);
            if (tokens < minTokens && chunks.length && estimateTokens(`${chunks.at(-1).content}\n\n${content}`) <= maxTokens) {
                chunks.at(-1).content = `${chunks.at(-1).content}\n\n${content}`;
                chunks.at(-1).tokensEstimated = estimateTokens(chunks.at(-1).content);
                continue;
            }
            chunks.push({
                index: index++,
                section: section.heading,
                content,
                tokensEstimated: tokens,
                metadata: { overlapTokens },
            });
        }
    }
    if (!chunks.length) throw new RagError("CHUNK_EMPTY", "Nenhum chunk foi gerado.");
    return chunks;
}

module.exports = { chunkDocument, splitLongText, splitSections };
