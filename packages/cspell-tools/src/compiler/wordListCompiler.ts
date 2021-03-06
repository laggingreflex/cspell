import { xregexp as XRegExp } from 'cspell-util-bundle';
import { genSequence, Sequence } from 'gensequence';
import * as Text from './text';
import * as lib from 'cspell-io';
import * as path from 'path';
import { mkdirp } from 'fs-extra';
import * as Trie from 'cspell-trie-lib';
import * as HR from 'hunspell-reader';
import { streamWordsFromFile } from './iterateWordsFromFile';
import { writeSeqToFile } from './fileWriter';
import { uniqueFilter } from 'hunspell-reader/dist/util';

const regNonWordOrSpace = XRegExp("[^\\p{L}' ]+", 'gi');
const regExpSpaceOrDash = /(?:\s+)|(?:-+)/g;
const regExpRepeatChars = /(.)\1{3,}/i;

export function normalizeWords(lines: Sequence<string>) {
    return lines.concatMap(line => lineToWords(line));
}

export function lineToWords(line: string): Sequence<string> {
    // Remove punctuation and non-letters.
    const filteredLine = line.replace(regNonWordOrSpace, '|');
    const wordGroups = filteredLine.split('|');

    const words = genSequence(wordGroups)
        .concatMap(a => [a, ...a.split(regExpSpaceOrDash)])
        .concatMap(a => splitCamelCase(a))
        .map(a => a.trim())
        .filter(a => !!a)
        .filter(s => !regExpRepeatChars.test(s))
        .map(a => a.toLowerCase());

    return words;
}

function splitCamelCase(word: string): Sequence<string> | string[] {
    const splitWords = Text.splitCamelCaseWord(word);
    // We only want to preserve this: "New York" and not "Namespace DNSLookup"
    if (splitWords.length > 1 && regExpSpaceOrDash.test(word)) {
        return genSequence(splitWords).concatMap(w => w.split(regExpSpaceOrDash));
    }
    return splitWords;
}

interface CompileWordListOptions {
    splitWords: boolean;
    sort: boolean;
}

export async function compileWordList(filename: string, destFilename: string, options: CompileWordListOptions): Promise<void> {
    const getWords = () => regHunspellFile.test(filename) ? readHunspellFiles(filename) : lib.asyncIterableToArray(lib.lineReaderAsync(filename));

    const destDir = path.dirname(destFilename);

    const pDir = mkdirp(destDir);

    const compile = options.splitWords ? compileWordListWithSplitSeq : compileSimpleWordListSeq;

    const words = genSequence(await getWords());
    const seq = compile(words)
        .filter(a => !!a)
        .filter(uniqueFilter(10000));

    const finalSeq = options.sort ? genSequence(sort(seq)) : seq;

    await pDir;

    return writeSeqToFile(finalSeq.map(a => a + '\n'), destFilename);
}



export function compileWordListWithSplit(filename: string, destFilename: string): Promise<void> {
    return compileWordList(filename, destFilename, { splitWords: true, sort: true });
}

export async function compileSimpleWordList(filename: string, destFilename: string, _options: CompileWordListOptions): Promise<void> {
    return compileWordList(filename, destFilename, { splitWords: false, sort: true });
}

function sort(words: Iterable<string>): Iterable<string> {
    return [...words].sort();
}

function compileWordListWithSplitSeq(words: Sequence<string>): Sequence<string> {
    return words.concatMap(line => lineToWords(line).toArray());
}

function compileSimpleWordListSeq(words: Sequence<string>): Sequence<string> {
    return words.map(a => a.toLowerCase());
}

export function normalizeWordsToTrie(words: Sequence<string>): Trie.TrieNode {
    const result = normalizeWords(words)
        .reduce((node: Trie.TrieNode, word: string) => Trie.insert(word, node), {} as Trie.TrieNode);
    return result;
}

export async function compileWordListToTrieFile(words: Sequence<string>, destFilename: string): Promise<void> {
    const destDir = path.dirname(destFilename);
    const pDir = mkdirp(destDir);
    const pRoot = normalizeWordsToTrie(words);
    const [root] = await Promise.all([pRoot, pDir]);

    return writeSeqToFile(Trie.serializeTrie(root, { base: 32, comment: 'Built by cspell-tools.' }), destFilename);
}

const regHunspellFile = /\.(dic|aff)$/i;

async function readHunspellFiles(filename: string): Promise<Sequence<string>> {
    const dicFile = filename.replace(regHunspellFile, '.dic');
    const affFile = filename.replace(regHunspellFile, '.aff');

    const reader = await HR.IterableHunspellReader.createFromFiles(affFile, dicFile);

    return genSequence(reader.iterateWords());
}

export async function compileTrie(filename: string, destFilename: string): Promise<void> {
    const words = await streamWordsFromFile(filename);
    return compileWordListToTrieFile(words, destFilename);
}
