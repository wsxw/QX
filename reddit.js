const body = JSON.parse($response.body)
let modified
if (body.data) {
  modified = true
  if (body.data.subredditInfoByName && body.data.subredditInfoByName.elements && body.data.subredditInfoByName.elements.edges) {
    body.data.subredditInfoByName.elements.edges = body.data.subredditInfoByName.elements.edges.filter(i => i && i.node && (i.node.__typename !== "AdPost"))
  } else if (body.data.homeV3 && body.data.homeV3.elements && body.data.homeV3.elements.edges) {
    body.data.homeV3.elements.edges = body.data.homeV3.elements.edges.filter(i => i && i.node && (i.node.adPayload === null))
  } else if(body.data.subredditsInfoByNames){
    body.data.subredditsInfoByNames = body.data.subredditsInfoByNames.map(i => ({...i, isNsfw: false}))
  } else {
    modified = false
  }
}
$done(modified ? { body: JSON.stringify(body) } : {})
