import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMarkovModel } from "../../api";
import { MarkovContext } from "../../providers";
import { MarkovState } from "../../hooks";
import { Convert } from "../../utils/convert";
import { errorAlert } from "../../utils/errorAlert";

import { RectBtn, StrBtn } from "../../components/buttons";
import { Footer } from "../../components/footer";
import { Textarea } from "../../components/form";
import { Modal, ModalOverlay, ModalContent } from "../../components/modal";
import { H2, H3 } from "../../components/text";
import style from "./style.module.scss";

const useModalState = (initValue: boolean): [boolean, () => void] => {
  const [isOpen, setIsOpen] = useState(initValue);
  const toggleModal = () => setIsOpen(!isOpen);
  return [isOpen, toggleModal];
};

export const Start = () => {
  const [isOpen, toggleModal] = useModalState(false);
  const [learningData, setText] = useState("");
  const jsonRef: React.RefObject<HTMLInputElement> = React.createRef();
  const navigate = useNavigate();
  const dispatch = useContext(MarkovContext)!.dispatch;

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.currentTarget.value);
  };

  const onSubmit = async () => {
    await fetchMarkovModel(learningData)
      .then((text) => {
        const model: MarkovState = JSON.parse(text);
        dispatch({ type: "MarkovGeneratedMsg", model: model });
        navigate("/fix");
      })
      .catch((status) => errorAlert(status));

    return false;
  };

  const readJson = () => {
    let fr = new FileReader();
    fr.addEventListener("load", (e) => {
      try {
        const model = Convert.toMarkovState(e.target?.result as string);
        dispatch({ type: "MarkovGeneratedMsg", model: model });
        navigate("/fix");
      } catch (e) {
        alert(`不正なファイルが入力されました。\n${e}`);
      }
    });

    const target = jsonRef.current as HTMLInputElement;
    fr.readAsText(target.files![0]);
    return false;
  };

  return (
    <div className={style.start}>
      <div className={style.main}>
        <H2>モデルの作成</H2>

        <p className={style.discription}>
          Lyrianに学習させる文章を入力してください。
          <br />
          制作している楽曲の雰囲気に合わせた文章を入力することで、その雰囲気に近い歌詞を生成します。
        </p>

        <form className={style.form} target="avoid" onSubmit={onSubmit}>
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
        </form>

        <StrBtn value="既にモデルをお持ちの方はこちら" onClick={toggleModal} />
      </div>

      <Modal isOpen={isOpen}>
        <ModalOverlay onClick={toggleModal} />
        <ModalContent>
          <H3>モデルのインポート</H3>
          <p className={style.discription}>
            作成したモデルファイルを選択してください。
          </p>
          <form className={style.form} target="avoid" onSubmit={readJson}>
            <div className={style.fileInput}>
              <input type="file" accept=".json" ref={jsonRef} required={true} />
            </div>
            <RectBtn value="読み込み" size="medium" type="submit" />
          </form>
        </ModalContent>
      </Modal>

      <iframe className={style.iframe} name="avoid" />

      <Footer />
    </div>
  );
};
