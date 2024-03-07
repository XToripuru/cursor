import { useState, useEffect } from 'react'
import './App.css'

function App() {

    useEffect(() => {
        let fetch = 1;
        let flag = true;

        const ws = new WebSocket("ws://127.0.0.1:8080");

        const messages = document.getElementById("messages");
        const input = document.getElementById("message-input");

        const rmessages = [];

        messages.addEventListener("scroll", (event) => {
            if(messages.scrollTop <= 540 && messages.scrollHeight > 0 
              && rmessages.length >= 100 && flag) 
            {
                console.log("fetching");
                ws.send(JSON.stringify({
                    type: "fetch",
                    id: fetch
                }));
            }
        });

        ws.addEventListener("open", (raw) => {

        });

        ws.addEventListener("message", (raw) => {
            const event = JSON.parse(raw.data);
            for(let k = event.length - 1; k>=0; k--) {
                rmessages.push({
                    content: event[k].content,
                    id: event[k].mid
                });
                const message = document.createElement("div");
                message.classList.add("message");
                message.innerHTML = event[k].content;
                messages.appendChild(message);
                messages.scrollTo(0, messages.scrollHeight);
            }
            fetch = rmesssages[0];
            if (event.length == 0) {
              flag = false;
            }
        });

        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (input.value == "") return;

                // const box = document.createElement("div");
                // box.classList.add("box");

                // const message = document.createElement("div");
                // message.classList.add("message");
                // message.innerHTML = input.value;

                // box.appendChild(message);
                //messages.appendChild(message);
                ws.send(JSON.stringify({
                    type: "message",
                    content: input.value
                }));
                input.value = "";

                input.style.height = "auto";
                input.style.height = `calc(${input.scrollHeight}px - 0.25rem)`;

                messages.scrollTo(0, messages.scrollHeight);
            }
        });
        input.addEventListener("input", (event) => {
            // input.style.height = "auto";
            input.style.height = `calc(${input.scrollHeight}px - 0.25rem)`;
        });
    });

    return (
        <>
            <div class="main">
                    <div id="messages">
                    </div>
                <div class="center">
                    <textarea id="message-input" rows="1"></textarea>
                </div>
            </div>
        </>
    )
}

export default App
