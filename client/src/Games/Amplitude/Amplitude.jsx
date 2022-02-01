import { useState, useEffect, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import "./Amplitude.css";

const Frequency = () => {
    return (
        <div className="amp-container">
            <div className="amp-main">
                <div className="amp-top">
                    <div className="amp-title">Amplitude</div>
                    <div className="amp-scores">
                        <div className="yellow-score">
                            Team 1 score
                        </div>
                        <div className="purple-score">
                            Team 2 Score
                        </div>
                    </div>
                </div>
                <div className="amp-mid">
                    Main Window
                </div>
                <div className="amp-bot">
                    Lower Window
                </div>
            </div>
        </div>
    )
}

export default Frequency
