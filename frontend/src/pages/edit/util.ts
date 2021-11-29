import { Lyric, Section } from "./types";
import { generateUniqueKey } from "../../utils/key";
import { MoraOrSyllable } from "../../components/form";
import { MarkovState, PartOfSpeech } from "../../hooks";
import { calcWordLen } from "../../utils/wordLength";
import { MarkovChain } from "../../utils/markov";
import { SYMBOLS } from "../../utils/chars";

export const getInitialLyric = () => ({
  key: generateUniqueKey(),
  value: "",
  notes: 3,
  unit: "シラブル" as MoraOrSyllable,
});

export const getInitialSection = () => ({
  key: generateUniqueKey(),
  name: "",
  verse: [getInitialLyric()],
});

export const getSectionName = (sections: Section[], index: number | null) => {
  if (index === null) return "";
  if (sections[index].name === "") return "無名のセクション";
  return `${sections[index].name}セクション`;
};

export class LyricGenerator {
  private lyric: Lyric;
  private chain: MarkovChain;

  constructor(lyric: Lyric, markov: MarkovState) {
    this.lyric = lyric;
    this.chain = new MarkovChain(markov);
  }

  public generate() {
    for (let _i = 0; _i < 64; _i++) {
      let tokens = [this.getFirstToken()];

      for (let _j = 0; _j < 64; _j++) {
        const tokensLen = tokens.reduce<number>((acc, cur) => {
          return acc + calcWordLen(cur, this.lyric.unit);
        }, 0);
        if (this.lyric.notes < tokensLen) {
          break;
        } else if (this.lyric.notes === tokensLen) {
          return tokens
            .reduce<string>((acc, cur) => acc + cur.word, "")
            .split("")
            .filter((char) => !SYMBOLS.includes(char))
            .reduce<string>((acc, cur) => acc + cur, "");
        }

        tokens.push(this.chain.next());
      }
    }

    throw Error(
      "歌詞を生成できませんでした。\n数回実行しても生成されない場合は、設定の変更や学習データの追加を行ってください。"
    );
  }

  private getFirstToken() {
    let token;
    while (true) {
      token = this.chain.next();
      if (
        token.part_of_speech !== PartOfSpeech.助詞 &&
        token.part_of_speech !== PartOfSpeech.助動詞
      ) {
        break;
      }
    }
    return token;
  }
}
