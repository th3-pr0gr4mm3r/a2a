import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import { open, save } from "@tauri-apps/plugin-dialog";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [format, setFormat] = useState("mp4");
  const [progress, setProgress] = useState("");
  const [audioSettings, setAudioSettings] = useState({ codec: "mp3", bitrate: "128k" });
  const [videoSettings, setVideoSettings] = useState({ codec: "h264", resolution: "1920x1080" });

  async function selectFile(isInput) {
    try {
      const selected = await open();
      if (selected) {
        if (isInput) {
          setInputPath(selected);
        } else {
          const output = await save();
          if (output) setOutputPath(output);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function runFfmpeg() {
    const isAudio = format.match(/mp3|wav|aac/);
    const settings = isAudio ? audioSettings : videoSettings;

    const args = [
      '-i', inputPath,
      ...(isAudio ? ['-codec:a', settings.codec, '-b:a', settings.bitrate] : ['-codec:v', settings.codec, '-s', settings.resolution]),
      '-f', format, outputPath
    ];
    const command = Command.sidecar('ffmpeg', args);
    const commandChild = await command.spawn();

    commandChild.stdout.on("data", (data) => {
      setProgress((prev) => prev + data);
    });

    commandChild.on("close", (code) => {
      if (code === 0) {
        alert("Conversion complete!");
      } else {
        alert(`Conversion failed with exit code ${code}`);
      }
    });
  }

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <div className="row">
        <button type="button" onClick={() => selectFile(true)}>Select Input File</button>
        <button type="button" onClick={() => selectFile(false)}>Select Output File</button>
        <input
          type="text"
          placeholder="Format (e.g., mp4, mp3)"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        />
      </div>
      {format.match(/mp3|wav|aac/) ? (
        <div>
          <h3>Audio Settings</h3>
          <input
            type="text"
            placeholder="Codec"
            value={audioSettings.codec}
            onChange={(e) => setAudioSettings({ ...audioSettings, codec: e.target.value })}
          />
          <input
            type="text"
            placeholder="Bitrate"
            value={audioSettings.bitrate}
            onChange={(e) => setAudioSettings({ ...audioSettings, bitrate: e.target.value })}
          />
        </div>
      ) : (
        <div>
          <h3>Video Settings</h3>
          <input
            type="text"
            placeholder="Codec"
            value={videoSettings.codec}
            onChange={(e) => setVideoSettings({ ...videoSettings, codec: e.target.value })}
          />
          <input
            type="text"
            placeholder="Resolution"
            value={videoSettings.resolution}
            onChange={(e) => setVideoSettings({ ...videoSettings, resolution: e.target.value })}
          />
        </div>
      )}
      <button type="button" onClick={runFfmpeg}>Start Conversion</button>
      <pre>{progress}</pre>
    </main>
  );
}

export default App;
