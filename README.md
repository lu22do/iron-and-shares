# TODO

* resell shares
* increase share price when buying
* end game

# Overview

This is a simple multiplayer strategy game based on the "1830: Railways and Robber Barons" board game (and the whole 18XX series). It is implemented a **Serverless Application** using **React** and **Firebase Firestore** (provides a real-time multiplayer database).

The game consists of rounds. Each round has 2 phases: stock trading phase & company operating phase. In each phase, players take turns.   

## Game Rules (Simplified 1830-style)

1.  **Stock Phase:** Players take turns buying shares of companies. Buying a share puts money into the Company's Treasury (Capitalization).
    
2.  **Operating Phase:** Companies operate in order of their stock price.
    
    *   Only the **President** (majority shareholder) controls the company.   
    *   **Lay Track:** Spend company money to increase the "Track Level" (Revenue potential).
    *   **Run Trains:** Generate revenue based on Track Level.
    *   **Dividends:** The President decides to pay dividends (increasing stock price) or withhold (keeping money in the company).
        
3.  **Winning:** The game has no fixed end in this demo, but the goal is to have the highest Net Worth (Cash + Stock Value).

## How to Play

1.  **Lobby:** Enter a name and "Create Game".
2.  **Invite:** Copy the Game ID and open this same chat in a new tab (or incognito window) to join as a second player.
3.  **Start:** Once all players are in, the host clicks "Start Game".

## Features & Mechanics Included:

*   **Multiplayer Architecture:** Uses Firebase Firestore to handle real-time turns, state synchronization, and lobby management (no Node.js server required).
*   **Stock Market (Round 1):** Players can buy shares from the initial offering. The money paid capitalizes the company (goes into the Company Treasury), allowing it to operate.
*   **Operating Round (Round 2):**

    *   **Presidency:** The game automatically calculates who owns the most shares of a company and grants them the "President's Desk" controls.        
    *   **Track Building:** Simplified to a "Level" system. Presidents spend company treasury to upgrade track, which increases potential revenue.
    *   **Dividends:** Presidents choose to **Pay Out** (distributing revenue to shareholders and raising stock price) or **Withhold** (keeping revenue in the company treasury for future builds, but slightly lowering stock price).
        
*   **Dynamic UI:** The interface updates in real-time. It highlights whose turn it is and only enables buttons for the active player.