'use client';

import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const BASE_URL = "https://ponypanic.io/playGameApi/v1";
  const [storyToken, setStoryToken] = useState("");
  const [map, setMap] = useState();
  const [hero, setHero] = useState();

  const startStory = () => {
    axios.post(BASE_URL + "/story/begin", {}, { headers: { "player-token": "954_I1VGS0h9Ln4sSiNfQlJUeUd+O1ZzcWcsfCFpQkVKblgyPD5Yc1hrY0Q=" } }).then((response) => {
      setStoryToken(response.data.storyPlaythroughToken)
      axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": response.data.storyPlaythroughToken } }).then((response2) => {
        setMap(response2.data.map);
        setHero(response2.data.heroes[0])
      })
    })
  }

  useEffect(() => {
    if (map && map.status === "WON") {
      nextLevel();
    }
  }, [map])

  useEffect(() => {
    console.log(map);
  }, [map])

  useEffect(() => {
    console.log(hero);
  }, [hero])

  const nextLevel = () => {
    axios.post(BASE_URL + "/story/nextLevel", {}, { headers: { "story-playthrough-token": storyToken } }).then((response) => {
      getState();
      console.log("CURRENT LEVEL: " + response.data.playthroughState.currentLevel)
    })
  }

  const getState = () => {
    axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": storyToken } }).then((response) => {
      setMap(response.data.map);
      setHero(response.data.heroes[0])
    })
  }

  const moveLeft = () => {
    axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_LEFT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      getState()
    })
  }

  const moveRight = () => {
    axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_RIGHT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      getState();
    })
  }

  const moveUp = () => {
    axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_UP"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      getState();
    })
  }

  const moveDown = () => {
    axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_DOWN"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      getState();
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10">
      {storyToken &&
        <div>
          <div>story:</div>
          {storyToken}
        </div>
      }
      <div className='mainButton cursor-pointer' onClick={() => startStory()}>
        New Story
      </div>
      {storyToken &&
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3">
            <div className='moveButton cursor-pointer col-start-2' onClick={() => moveUp()}>
              UP
            </div>
            <div className='cursor-pointer' onClick={() => moveUp()}>
            </div>
            <div className='moveButton cursor-pointer' onClick={() => moveLeft()}>
              LEFT
            </div>
            <div className='moveButton cursor-pointer col-start-3' onClick={() => moveRight()}>
              RIGHT
            </div>
            <div className='moveButton cursor-pointer col-start-2' onClick={() => moveDown()}>
              DOWN
            </div>
          </div>
          <div className='mainButton cursor-pointer' onClick={() => getState()}>
            Get State
          </div>
        </div>
      }
    </main>
  )
}
