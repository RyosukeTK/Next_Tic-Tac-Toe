import Image from "next/image";
import Game from "../components/Game";

export default function Home() {
  return (
    <main>
      <h1>マルバツゲーム (3つまで)</h1>
      <Game />
    </main>
  );
}
