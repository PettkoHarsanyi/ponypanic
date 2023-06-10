'use client';

import axios from "axios";
import { useEffect, useReducer, useState } from "react";
import { Graph, astar } from "javascript-astar"
import { BiDownArrow, BiLeftArrow, BiRightArrow, BiUpArrow } from "react-icons/bi"
import { GiCircle } from "react-icons/gi"

export default function Home() {
  const BASE_URL = "https://ponypanic.io/playGameApi/v1";
  const [storyToken, setStoryToken] = useState("");
  const [map, setMap] = useState();
  const [hero, setHero] = useState();
  const [resource, setResource] = useState();
  const [coordinateMap, setCoordinateMap] = useState()

  const startStory = async () => {
    await axios.post(BASE_URL + "/story/begin", {}, { headers: { "player-token": "954_I1VGS0h9Ln4sSiNfQlJUeUd+O1ZzcWcsfCFpQkVKblgyPD5Yc1hrY0Q=" } }).then((response) => {
      setStoryToken(response.data.storyPlaythroughToken)
    })
  }
  // AMIKOR MEGÉRKEZETT A STORYTOKEN (ÚJ JÁTÉK INDÍTÁSÁNÁL)
  useEffect(() => {
    if (storyToken !== "") {
      startLevel();
    }
  }, [storyToken])

  const startLevel = async () => {
    console.log("startlevel")
    axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": storyToken } }).then((response2) => {
      setMap(response2.data.map);
      setHero(response2.data.heroes[0])
      axios.get(BASE_URL + "/play/mapResource", { headers: { "story-playthrough-token": storyToken } }).then((response3) => {
        setResource(response3.data)
      })
    })
  }
  // AMIKOR A RESOURCE IS MEGJÖTT TEHÁT A STARTLEVEL BEFEJEZŐDÖTT
  useEffect(() => {
    if (map && map.status === "CREATED") {
      setOverallCoordinateMap(map, hero, resource);
    }
  }, [resource])

  const setOverallCoordinateMap = () => {
    let coordMap = [...Array(map.height)]
    coordMap = coordMap.map(row => [...Array(map.width)]);

    map.treasures.forEach(treasure => { if (treasure.collectedByHeroId === null) coordMap[treasure.position.y][treasure.position.x] = "T" });
    map.enemies.forEach(enemy => { if (enemy.health > 0) coordMap[enemy.position.y][enemy.position.x] = "E" });
    map.bullets.forEach(bullet => { coordMap[bullet.position.y][bullet.position.x] = "B" });

    Object.entries(resource.compressedObstacles.coordinateMap).forEach(entry => {
      entry[1].forEach(y => {
        coordMap[y][entry[0]] = "O"
      })
    })

    coordMap[hero.position.y][hero.position.x] = "H"

    coordMap = coordMap.map(row => {
      return row.map(cell => {
        if (cell === undefined) {
          return "."
        }
        return cell;
      })
    })

    setCoordinateMap(coordMap)
  }

  useEffect(() => {
    if (coordinateMap !== undefined && map.status == "CREATED") {
      console.log("MEHET A REKURZIÓ, MINDEN KÉSZEN ÁLL:")
      console.log(coordinateMap);
      move();
    }
  }, [coordinateMap])

  const [autoPlay, setAutoPlay] = useState(false);

  const move = () => {
    if (!autoPlay) return;
    let obstacleMap = [...coordinateMap.map(y => y.map(x => x == "O" ? 0 : 1))]
    let graph = new Graph(obstacleMap)
    let start = graph.grid[hero.position.y][hero.position.x];


    let ends = map.treasures.map(treasure => graph.grid[treasure.position.y][treasure.position.x])
    let results = ends.map((end) => astar.search(graph, start, end))

    results = results.sort((a, b) => a.length - b.length)

    console.log(results);

    let paths = results.map((result, index) => {
      if (index === 0) {
        return result;
      } else {
        let nextStart = graph.grid[results[index - 1][results[index - 1].length - 1].x][results[index - 1][results[index - 1].length - 1].y];
        let nextEnd = graph.grid[result[result.length - 1].x][result[result.length - 1].y]
        console.log(nextStart);
        console.log(nextEnd);
        return astar.search(graph, nextStart, nextEnd)
      }
    })

    console.log(paths);

    let flatPaths = []

    paths.forEach(path => flatPaths = flatPaths.concat(path))



    let heroPos = { x: hero.position.y, y: hero.position.x }
    const interval = setInterval(() => {
      const nextStep = flatPaths.shift();

      if (heroPos.x === nextStep.x && heroPos.y < nextStep.y) moveRight();
      if (heroPos.x === nextStep.x && nextStep.y < heroPos.y) moveLeft();
      if (heroPos.y === nextStep.y && heroPos.x < nextStep.x) moveUp();
      if (heroPos.y === nextStep.y && nextStep.x < heroPos.x) moveDown();

      heroPos.x = nextStep.x;
      heroPos.y = nextStep.y;

      if (flatPaths.length === 0) {
        clearInterval(interval);
      }
    }, 1000)
  }

  // API HÍVÁS A KÖVETKEZŐ SZINT LEKÉRÉSÉRE
  const nextLevel = async () => {
    await axios.post(BASE_URL + "/story/nextLevel", {}, { headers: { "story-playthrough-token": storyToken } }).then(async (response) => {
      startLevel();
    })
  }

  useEffect(() => {
    if (map && map.status === "WON") {
      nextLevel();
    }
  }, [map])


  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (dataReady) {
      setDataReady(false);
      setOverallCoordinateMap(hero, map, resource);
    }
  }, [dataReady])

  // API HÍVÁS A PÁLYA ÁLLAPOTÁNAK LEKÉRÉSÉRE
  const getState = async () => {
    await axios.get(BASE_URL + "/play/mapState", { headers: { "story-playthrough-token": storyToken } }).then(async (response) => {
      setMap(response.data.map);
      setHero(response.data.heroes[0])
      setDataReady(true);
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
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("LÉPTEM EGYET BALRA")
      await getState()
    })
  }

  // API HÍVÁS A JOBBRA MOZGÁSRA
  const moveRight = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_RIGHT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("LÉPTEM EGYET JOBBRA")
      await getState();
    })
  }

  // API HÍVÁS A FEL MOZGÁSRA
  const moveUp = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_UP"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("LÉPTEM EGYET FEL")
      await getState();
    })
  }

  // API HÍVÁS A LE MOZGÁSRA
  const moveDown = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "MOVE_DOWN"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("LÉPTEM EGYET LE")
      await getState();
    })
  }

  const attackUp = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "KICK_DOWN"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("ÜTÖTTEM EGYET FEL")
      setIsNextAttack(false)
      await getState();
    })
  }

  const attackDown = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      // HIBALEHETŐSÉG, VAGY KICK_DOWN
      "action": "KICK_UP"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("ÜTÖTTEM EGYET LE")
      setIsNextAttack(false)
      await getState();
    })
  }

  const attackLeft = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "KICK_LEFT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("ÜTÖTTEM EGYET BALRA")
      setIsNextAttack(false)
      await getState();
    })
  }

  const attackRight = async () => {
    await axios.post(BASE_URL + "/play/approveHeroTurn", {
      "heroId": null,
      "action": "KICK_RIGHT"
    }, { headers: { "story-playthrough-token": storyToken } }).then(async () => {
      console.log("ÜTÖTTEM EGYET JOBBRA")
      setIsNextAttack(false)
      await getState();
    })
  }

  const [isNextAttack, setIsNextAttack] = useState(false);

  return (
    <main className="flex min-h-screen flex-col lg:flex-row items-center justify-center lg:mt-0 mt-16">
      <div className="w-full lg:w-1/2 h-max lg:h-screen flex flex-row justify-center items-center" >
        <div className="flex flex-col py-10 px-8 gap-5" style={{ border: "0.6vh solid white", width: "55%", aspectRatio: "0.62", borderRadius: "3vh 3vh 7vh 7vh" }}>
          <div className="flex flex-col justify-center items-center" style={{ border: "0.5vh solid white", height: "50%", borderRadius: "1vh 1vh 4vh 4vh" }}>
            <div className="aspect-square relative" style={{ border: "0.4vh solid white", width: "60%", borderRadius: "1vh", boxShadow: "inset 0 0 2vh 0.5vh gray" }}>
              {storyToken &&
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <tbody>
                    {coordinateMap && coordinateMap.map((row, index1) => { return <tr key={index1}>{row.map((cell, index2) => { return <td key={index2} style={{ verticalAlign: "center", textAlign: "center", border: "0.2vh solid white" }}>{coordinateMap[coordinateMap.length - index1 - 1][index2]}</td> })}</tr> })}
                  </tbody>
                </table>
              }
            </div>
            <div className="font-bold text-lg">Debugger</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-5">
            <div className="font-extrabold px-4 text-xl" style={{ border: "0.3vh solid white", borderRadius: "1vh", lineHeight: "1.2" }}>PonyPanic</div>
            <div className="flex flex-row w-full">
              <div className="w-1/2">
                <div className="aspect-square relative left-[15%] grid grid-cols-3" style={{ width: "60%" }}>
                  <div className="col-start-2 moveButton mBup" style={{ border: "solid white", borderWidth: "0.3vh 0.3vh 0 0.3vh", borderRadius: "0.5vh 0.5vh 0 0", zIndex: 52 }} onClick={() => isNextAttack ? attackUp() : coordinateMap ? moveUp() : null}><BiUpArrow className={`${isNextAttack ? "text-red-700" : "text-white"}`} /></div>
                  <div></div>
                  <div className="moveButton mBleft" style={{ border: "solid white", borderWidth: "0.3vh 0 0.3vh 0.3vh", borderRadius: "0.5vh 0 0 0.5vh" }} onClick={() => isNextAttack ? attackLeft() : coordinateMap ? moveLeft() : null}><BiLeftArrow className={`${isNextAttack ? "text-red-700" : "text-white"}`} /></div>
                  <div className="flex flex-col justify-center items-center" style={{ overflow: "hidden", backgroundColor: "black", zIndex: 100, color: isNextAttack ? "red" : "white" }}><div className={`w-1/2 h-1/2 rounded-full ${isNextAttack ? "animateCircle" : ""}`} style={{ border: "0.1vh solid white" }}></div></div>
                  <div className="moveButton mBright" style={{ border: "solid white", borderWidth: "0.3vh 0.3vh 0.3vh 0", borderRadius: " 0 0.5vh 0.5vh 0" }} onClick={() => isNextAttack ? attackRight() : coordinateMap ? moveRight() : null}><BiRightArrow className={`${isNextAttack ? "text-red-700" : "text-white"}`} /></div>
                  <div className="col-start-2 moveButton mBdown" style={{ border: "solid white", borderWidth: "0 0.3vh 0.3vh 0.3vh", borderRadius: "0 0 0.5vh 0.5vh" }} onClick={() => isNextAttack ? attackDown() : coordinateMap ? moveDown() : null}><BiDownArrow className={`${isNextAttack ? "text-red-700" : "text-white"}`} /></div>
                </div>
              </div>
              <div className="w-1/2 flex flex-row justify-end items-center gap-2 lg:gap-5 pr-[5%]">
                <div className="flex flex-col justify-center w-min relative top-3">
                  <div className="aspect-square rounded-full cursor-pointer attackButton w-full" style={{ border: "0.2vh solid white" }} onClick={() => coordinateMap ? shield() : null}></div>
                  <div className="text-[0.5rem] sm:text-sm lg:text-xs xl:text-base" >SHIELD</div>
                </div>
                <div className="flex flex-col justify-center w-min relative bottom-3">
                  <div className={`aspect-square rounded-full cursor-pointer attackButton ${isNextAttack ? "attackSelected" : ""} w-full`} onClick={() => { setIsNextAttack((isNextAttack) => !isNextAttack) }} style={{ border: "0.2vh solid white" }} ></div>
                  <div className="text-[0.5rem] sm:text-sm lg:text-xs xl:text-base">ATTACK</div>
                </div>
              </div>
            </div>
            <div className="px-4 text-xl mt-10 flex flex-row justify-center items-center" >
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => {setAutoPlay(false); startStory()}}>
                <div style={{ width: "6vh", height: "2vh", border: "0.1vh solid white", borderRadius: "10vh", }}></div>
                <div className="font-extrabold px-4 text-sm">START</div>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() =>{setAutoPlay(true); startStory()}}>
                <div style={{ width: "6vh", height: "2vh", border: "0.1vh solid white", borderRadius: "10vh", }}></div>
                <div className="font-extrabold px-4 text-sm">AUTO</div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-max lg:h-screen">
        <div className="text-4xl lg:text-5xl xl:text-6xl m-20 font-bold">DEBUGGER (IN BIG):</div>
        <div className="aspect-square m-20 max-h-[70%] relative overflow-hidden text-6xl" style={{ border: "0.5vh solid white", borderRadius: "3vh 3vh 3vh 3vh ", boxShadow: "inset 0 0 2vh 0.5vh gray" }}>
          {storyToken &&
            <table style={{ borderCollapse: "collapse", width: "100%", }}>
              <tbody>
                {coordinateMap && coordinateMap.map((row, index1) => { return <tr key={index1}>{row.map((cell, index2) => { return <td key={index2} style={{ verticalAlign: "center", textAlign: "center", border: "0.2vh solid white" }}>{coordinateMap[coordinateMap.length - index1 - 1][index2]}</td> })}</tr> })}
              </tbody>
            </table>
          }
        </div>
      </div>
    </main>
  )
}
