/**
 * A token of morphological analysis.
 */
export interface Token {
  word: string;
  mora: string;
  syllable: string;
  partOfSpeech: string;
}

/**
 * A table of Walker's Alias Method.
 */
interface AliasTable {
  aliases: Int32Array;
  probs: Float32Array;
}

/**
 * A state of Markov chain model.
 */
export interface MarkovState {
  tokens: Token[];
  stateSpace: AliasTable[];
  length: number;
}

/**
 * A state of Lyrics.
 */
export interface LyricsState {
  contents: string;
}
