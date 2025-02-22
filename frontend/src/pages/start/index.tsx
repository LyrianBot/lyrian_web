import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMarkovModel } from "../../api";
import { LyricsContext, MarkovContext, ToasterContext } from "../../providers";
import { useBoolState } from "../../hooks";
import { MarkovState, Token } from "../../hooks/markov";
import { hasUnknownTokens } from "../../utils/token";

import { RectBtn, StrBtn } from "../../components/buttons";
import { Form, Textarea } from "../../components/form";
import { Loading } from "../../components/loading";
import { Main } from "../../components/layout";
import { Modal, ModalOverlay, ModalContent } from "../../components/modal";
import { Description, H2, H3 } from "../../components/text";
import {
  MountStatus,
  Transition,
  TRANSITION_TIME,
} from "../../components/transition";
import style from "./style.module.scss";
import { SaveData } from "../../types";

export const Start = () => {
  const { mkvDispatch } = useContext(MarkovContext)!;
  const { lyrDispatch } = useContext(LyricsContext)!;
  const { bake } = useContext(ToasterContext)!;

  const [status, setStatus] = useState<MountStatus>("willMount");
  const [learningData, setText] = useState("");
  const [isOpen, toggleModal] = useBoolState(false);
  const [isLoading, setLoading] = useState(false);

  const jsonRef: React.RefObject<HTMLInputElement> = React.createRef();

  const navigate = useNavigate();

  useEffect(() => {
    if (status === "willMount") setStatus("mounted");
  }, [status]);

  const jumpFixOfEdit = (tokens: Token[]) => {
    if (hasUnknownTokens(tokens)) {
      setTimeout(() => navigate("/fix"), TRANSITION_TIME, false);
    } else {
      setTimeout(() => navigate("/edit"), TRANSITION_TIME, false);
    }
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.currentTarget.value);
  };

  const onSubmit = async () => {
    setStatus("willUnmount");
    setLoading(true);

    await fetchMarkovModel(learningData)
      .then((text) => {
        const model: MarkovState = JSON.parse(text);
        mkvDispatch({ type: "MarkovReadedMsg", model: model });
        jumpFixOfEdit(model.state_space);
      })
      .catch((status) => {
        bake({
          type: "error",
          value: `サーバー通信時にエラーが発生しました。(${status})`,
        });
        setStatus("mounted");
        setLoading(false);
      });
  };

  const readJson = () => {
    let fr = new FileReader();
    fr.addEventListener("load", (e) => {
      try {
        const json: SaveData = JSON.parse(e.target?.result as string);
        if (json.markov === undefined || json.lyrics === undefined) {
          throw Error("Invalid json file was input.");
        }

        mkvDispatch({ type: "MarkovReadedMsg", model: json.markov });
        lyrDispatch({ type: "LyricsReadedMsg", newLyrics: json.lyrics });

        setStatus("willUnmount");
        jumpFixOfEdit(json.markov.state_space);
      } catch (_) {
        setStatus("mounted");
        bake({
          type: "error",
          value: "不正なファイル、または破損したファイルが入力されました。",
        });
      }
    });

    const target = jsonRef.current as HTMLInputElement;
    fr.readAsText(target.files![0]);
    toggleModal();
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      <Transition status={status}>
        <div className={style.start}>
          <Main>
            <H2>モデルの作成</H2>

            <Description>
              Lyrianに学習させる文章を入力してください。
              <br />
              制作している楽曲の雰囲気に合わせた文章を入力することで、その雰囲気に近い歌詞を生成します。
            </Description>

            <Form onSubmit={onSubmit}>
              <div className={style.textarea}>
                <Textarea
                  placeholder="文章を入力してください。"
                  value={learningData}
                  onChange={onTextareaChange}
                  required={true}
                />
              </div>

              <p className={style.notice}>
                ※ 使用する文章の著作権にご注意ください。
              </p>

              <div className={style.genModelBtn}>
                <RectBtn value="作成" size="large" type="submit" />
              </div>
            </Form>

            <StrBtn size="small" onClick={toggleModal}>
              編集中のデータをお持ちの方はこちら
            </StrBtn>
          </Main>

          <Modal isOpen={isOpen}>
            <ModalOverlay onClick={toggleModal} />
            <ModalContent>
              <H3>編集データのインポート</H3>
              <Description>
                ダウンロードした編集データを選択してください。
              </Description>
              <Form onSubmit={readJson}>
                <div className={style.fileInput}>
                  <input
                    type="file"
                    accept=".json"
                    ref={jsonRef}
                    required={true}
                  />
                </div>
                <RectBtn value="読み込み" size="medium" type="submit" />
              </Form>
            </ModalContent>
          </Modal>
        </div>
      </Transition>
    </>
  );
};
