'use client';

import axios from "axios";
import { useEffect, useState } from "react";
import { Graph, astar } from "javascript-astar"

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

  // AMIKOR A STORYTOKEN VÁLTOZIK (ÚJ JÁTÉK INDÍTÁSÁNÁL)
  useEffect(() => {
    if (storyToken !== "") {
      startLevel();
    }
  }, [storyToken])

  useEffect(() => {
    if (map && map.status === "CREATED") {
      setOverallCoordinateMap(map, hero, resource);
    }
  }, [resource])

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

  // const move = async () => {
  // console.log("INDUL A TICK, ITT VANNAK AZ ADATOK AMIKET KAPTAM")
  // console.log(coordinateMap);

  // let obstacleMap = [...coordinateMap.map(y => y.map(x => x == "O" ? 0 : 1))]
  // console.log(obstacleMap);

  // let graph = new Graph(obstacleMap)
  // let start = graph.grid[hero.position.y][hero.position.x];
  // let end = graph.grid[map.treasures[0].position.y][map.treasures[0].position.x];

  // var result = astar.search(graph, start, end);

  // console.log("HERO: x: " + hero.position.y + " y: " + hero.position.x)
  // console.log("KÖVI LEPES: x: " + result[0].x + " y: " + result[0].y)

  // result.forEach( async (node) => {
  //   console.log(node);
  //   if (node.x == hero.position.y && node.y > hero.position.x) {
  //     await moveRight();
  //   }
  //   if (node.x == hero.position.y && node.y < hero.position.x) {
  //     await moveLeft();
  //   }
  //   if (node.x < hero.position.y && node.y == hero.position.x) {
  //     await moveDown();
  //   }
  //   if (node.x > hero.position.y && node.y == hero.position.x) {
  //     await moveUp();
  //   }
  // })

  // console.log(start);
  // console.log(end);


  // console.log(result);

  // var graph = new Graph([
  //   [1, 1, 1, 1],
  //   [0, 1, 1, 0],
  //   [0, 0, 1, 1]
  // ]);
  // var start = graph.grid[0][0];
  // var end = graph.grid[1][2];
  // var result = astar.search(graph, start, end);

  // console.log([
  //   [1, 1, 1, 1],
  //   [0, 1, 1, 0],
  //   [0, 0, 1, 1]
  // ])
  // console.log(graph);
  // console.log(result);
  // }

  const setOverallCoordinateMap = () => {
    // if (!_map) _map = map;
    // if (!_hero) _hero = hero;
    // if (!_resource) _resource = resource;
    let coordMap = [...Array(map.height)]
    coordMap = coordMap.map(row => [...Array(map.width)]);


    map.treasures.forEach(treasure => { if (treasure.collectedByHeroId === null) coordMap[treasure.position.y][treasure.position.x] = "T" });

    Object.entries(resource.compressedObstacles.coordinateMap).forEach(entry => {
      entry[1].forEach(y => {
        coordMap[y][entry[0]] = "O"
      })
    })

    coordMap[hero.position.y][hero.position.x] = "H"

    coordMap = coordMap.map(row => {
      return row.map(cell => {
        if (cell === undefined) {
          return "-"
        }
        return cell;
      })
    })

    setCoordinateMap(coordMap)
  }

  // useEffect(() => {
  //   console.log("MAP:")
  //   console.log(map);
  //   console.log("---------")

  // }, [map])

  // useEffect(() => {
  //   console.log("HERO:")
  //   console.log(hero);
  //   console.log("---------")
  // }, [hero])

  // useEffect(() => {
  //   console.log("RESOURCE:")
  //   console.log(resource);
  //   console.log("---------")

  // }, [resource])

  // useEffect(() => {
  //   console.log("coordmap:")
  //   console.log(coordinateMap);
  //   console.log("---------")
  // }, [coordinateMap])

  // useEffect(() => {
  //   if (coordinateMap && coordinateMap !== undefined && map && map.status == "CREATED") {
  //     move();
  //   }
  // }, [map, coordinateMap])

  // useEffect(() => {
  //   if (map && map.status === "WON") {
  //     nextLevel();
  //   }
  // }, [map])

  // const [dataReady, setDataReady] = useState(false);

  // useEffect(() => {
  //   if (hero !== undefined && map !== undefined && resource !== undefined) {

  //   }
  // }, [resource])

  // API HÍVÁS A KÖVETKEZŐ SZINT LEKÉRÉSÉRE
  const nextLevel = async () => {
    await axios.post(BASE_URL + "/story/nextLevel", {}, { headers: { "story-playthrough-token": storyToken } }).then(async (response) => {
      startLevel();
    })
  }

  useEffect(()=>{
    if(map && map.status === "WON"){
      nextLevel();
    }
  },[map])


  const [dataReady,setDataReady] = useState(false);

  useEffect(()=>{
    if(dataReady){
      setDataReady(false);
      setOverallCoordinateMap(hero,map,resource);
    }
  },[dataReady])

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
              {coordinateMap && coordinateMap.map((row, index1) => { return <tr key={index1}>{row.map((cell, index2) => { return <td key={index2} className="w-10 h-10" style={{ verticalAlign: "center", textAlign: "center", border: "0.2vh solid white" }}>{coordinateMap[coordinateMap.length - index1 - 1][index2]}</td> })}</tr> })}
            </tbody>
          </table>
        </div>
      }
    </main>
  )
}
