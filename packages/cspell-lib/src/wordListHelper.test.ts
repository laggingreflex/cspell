import {expect} from 'chai';
import * as wlh from './wordListHelper';

describe('Validate wordListHelper', () => {
    test('tests splitLineIntoWords', () => {
        const line = 'New York City';
        const words = wlh.splitLineIntoWords(line);
        expect([...words]).to.be.deep.equal([line, ...line.split(' ')]);
    });

    test('tests splitLineIntoCodeWords', () => {
        const line = 'cSpell:disableCompoundWords extra';
        const words = wlh.splitLineIntoCodeWords(line);
        expect([...words]).to.be.deep.equal([
            'cSpell',
            'disableCompoundWords',
            'extra',
            'c',
            'Spell',
            'disable',
            'Compound',
            'Words',
        ]);
    });

    test('tests splitLineIntoCodeWordsRx', () => {
        const line = 'New York City';
        const words = wlh.splitLineIntoCodeWords(line);
        expect([...words]).to.be.deep.equal([
            'New York City',
            'New', 'York', 'City',
        ]);
    });

    test('tests loadWordsRx error handling', async () => {
        const values = await wlh.loadWordsNoError('not_found.txt');
        expect([...values]).to.be.empty;
    });
});
