'use client';

import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const BASE_URL = "https://ponypanic.io/playGameApi/v1";
  const [storyToken, setStoryToken] = useState("");
  const [map, setMap] = useState();
  const [hero, setHero] = useState();
  const [resource, setResource] = useState();

  // AZ ELSŐ LÉPÉS A JÁTÉKBAN, ELINDÍTJUK A STORY-T
  // MEGKAPJUK A STORYPLAYTHROUGHTOKEN-T
  // LEKÉRJÜK A PÁLYÁT,
  // ÉS BEÁLLÍTJUK AZT A JÁTÉKOSSAL EGYÜTT
  const startStory = async () => {
    await axios.post(BASE_URL + "/story/begin", {}, { headers: { "player-token": "954_I1VGS0h9Ln4sSiNfQlJUeUd+O1ZzcWcsfCFpQkVKblgyPD5Yc1hrY0Q=" } }).then((response) => {
      setStoryToken(response.data.storyPlaythroughToken)
      axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": response.data.storyPlaythroughToken } }).then((response2) => {
        setMap(response2.data.map);
        setHero(response2.data.heroes[0])
        axios.get(BASE_URL + "/play/mapResource", { headers: { "story-playthrough-token": response.data.storyPlaythroughToken } }).then((response3) => {
          setResource(response3.data)
        })
      })
    })
  }

  useEffect(() => {
    console.log("MAP:")
    console.log(map);
    console.log("---------")
  }, [map])

  useEffect(() => {
    console.log("HERO:")
    console.log(hero);
    console.log("---------")
  }, [hero])

  useEffect(() => {
    console.log("RESOURCE:")
    console.log(resource);
    console.log("---------")
    if (resource) {
      Object.entries(resource.compressedObstacles.coordinateMap).forEach((entry) => console.log(entry));
    }

  }, [resource])

  // MINDEN ALKALOMMAL, AMIKOR GETSTATE() VAN
  // TEHÁT VÁLTOZIK A "MAP", AKKOR MEGNÉZZÜK
  // HOGY NYERTÜNK E. HA IGEN -> ÚJ SZINT
  useEffect(() => {
    if (map && map.status === "WON") {
      nextLevel();
    }
  }, [map])

  // API HÍVÁS A KÖVETKEZŐ SZINT LEKÉRÉSÉRE
  const nextLevel = async () => {
    await axios.post(BASE_URL + "/story/nextLevel", {}, { headers: { "story-playthrough-token": storyToken } }).then((response) => {
      getState();
      console.log("CURRENT LEVEL: " + response.data.playthroughState.currentLevel)
      axios.get(BASE_URL + "/play/mapResource", { headers: { "story-playthrough-token": storyToken } }).then((response3) => {
        setResource(response3.data)
      })
    })
  }

  // API HÍVÁS A PÁLYA ÁLLAPOTÁNAK LEKÉRÉSÉRE
  const getState = async () => {
    await axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": storyToken } }).then((response) => {
      setMap(response.data.map);
      setHero(response.data.heroes[0])
    })
  }

  // API HÍVÁS PAJZSRA
  const shield = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": hero.id,
      "action": "USE_SHIELD",
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      console.log("PAJZSOT HASZNÁLTAM")
      getState()
    })
  }

  // API HÍVÁS A BALRA MOZGÁSRA
  const moveLeft = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_LEFT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      console.log("LÉPTEM EGYET BALRA")
      getState()
    })
  }

  // API HÍVÁS A JOBBRA MOZGÁSRA
  const moveRight = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_RIGHT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      console.log("LÉPTEM EGYET JOBBRA")
      getState();
    })
  }

  // API HÍVÁS A FEL MOZGÁSRA
  const moveUp = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_UP"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      console.log("LÉPTEM EGYET FEL")
      getState();
    })
  }

  // API HÍVÁS A LE MOZGÁSRA
  const moveDown = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_DOWN"
    }, { headers: { "story-playthrough-token": storyToken } }).then(() => {
      console.log("LÉPTEM EGYET LE")
      getState();
    })
  }

  return (
    <main className="flex min-h-screen flex-row items-center justify-center gap-10">
      <div className="flex flex-col gap-10 ">
        {storyToken &&
          <div>
            <div>story:</div>
            {storyToken}
          </div>
        }
        <div className='mainButton cursor-pointer text-center' onClick={() => startStory()}>
          New Story
        </div>
        {storyToken &&
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3">
              <div className='moveButton cursor-pointer col-start-2' onClick={() => moveUp()}>
                UP
              </div>
              <div>
              </div>
              <div className='moveButton cursor-pointer' onClick={() => moveLeft()}>
                LEFT
              </div>
              <div className="moveButton cursor-pointer m-2" onClick={() => shield()}>
                SHIELD
              </div>
              <div className='moveButton cursor-pointer col-start-3' onClick={() => moveRight()}>
                RIGHT
              </div>
              <div className='moveButton cursor-pointer col-start-2' onClick={() => moveDown()}>
                DOWN
              </div>
            </div>
            <div className='mainButton cursor-pointer text-center' onClick={() => getState()}>
              Get State
            </div>
          </div>
        }
      </div>
      {storyToken &&
        <div className="flex flex-col gap-5">
          <div>Debugger:</div>
          <table style={{ border: "0.5vh solid white", borderCollapse: "collapse" }}>
            <tbody>
              {map && [...Array(map.height)].map((tr, index) => {
                let yIndex = map.height - index - 1;
                return <tr key={index}>{[...Array(map.width)].map((td, xIndex) => {
                  return <td key={xIndex} className="w-10 h-10" style={{ verticalAlign: "center", textAlign: "center", border: "0.2vh solid white" }}>
                    {hero && xIndex == hero.position.x && yIndex == hero.position.y ? "P" : ""}
                    {map && map.treasures.some((treasure) => treasure.position.x == xIndex && treasure.position.y == yIndex && treasure.collectedByHeroId == null) ? "X" : ""}
                    {resource && Object.entries(resource.compressedObstacles.coordinateMap).some((entry)=>{return entry[1].some(y=> entry[0] == xIndex && y == yIndex)}) ? "O" : ""}
                  </td>
                })}</tr>
              })}
            </tbody>
          </table>
        </div>
      }
    </main>
  )
}
