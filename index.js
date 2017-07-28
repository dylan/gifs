import {h, app} from 'hyperapp'
import moment from 'moment'
import { accessKeyID, secretAccessKey } from './awsKeys'

const s3 = new AWS.S3({
    credentials: new AWS.Credentials({
        accessKeyId: accessKeyID,
        secretAccessKey: secretAccessKey
    })
})

const params = {
    Bucket: 'gif.dyli.sh'
}

const filteredItems = ["index.html", "robots.txt", "bundle.js"]

const SortType = {
    Name: 0,
    Date: 1
}

const SortOrder = {
    Asc: 0,
    Desc: 1
}

function sortDate(mode, a, b) {
    const [aTime, bTime] = [a.lastModified.getTime(), b.lastModified.getTime()]
    return genericSort(mode, aTime, bTime)
}

function sortName(mode, a, b) {
    const [aName, bName] = [a.name.toLowerCase(), b.name.toLowerCase()]
    return genericSort(mode, aName, bName)
}

function genericSort(mode, a, b) {
    if (a < b) {
        return mode == SortOrder.Asc ? -1 : 1
    }
    if (a > b) {
        return mode == SortOrder.Asc ? 1 : -1
    }
    return 0
}

const ListItem = ({item, hovered, actions}) => (
    <tr key={ item.name }
        onmouseenter={ _ => actions.hover(item) }
        onmouseleave={ _ => actions.hover(null) }
    >
        <td><a href={`http://${params.Bucket}/${item.name}`}>{ item.name }</a></td>
        <td>{ moment(item.lastModified).format("YYYY MMM Do") }</td>
    </tr>
)

const Viewer = ({item}) => (
    <viewer class={ item ? `active` : null }>
        <img src={item ? `http://${params.Bucket}/${item.name}` : null}
             onload={ event => {
                let parent = event.path[1]
                let img = event.target
                parent.style.width = `${img.naturalWidth/3}px`
                parent.style.height = `${img.naturalHeight/3}px`
             }}
        />
    </viewer>
)

app({
    state: {
        "items": [],
        "filter": null,
        "sortFunction": sortDate,
        "sort": SortOrder.Asc,
        "hoveredItem": null
    },

    view: (state, actions) => {
        const items = state.items
                        .sort((a, b) => state.sortFunction(state.sort, a, b))
                        .filter(item => !filteredItems.includes(item.name.toLowerCase()))
                        .filter(item => {
                            if(!state.filter) return true
                            return item.name.match(state.filter)
                        })

        return (
            <main>
                <Viewer  item={state.hoveredItem} />

                <input placeholder='Search...' type='text' oninput={ actions.search }/>

                <table class='sortTable'>
                    <tr class='sortRow' >
                        <td><a onclick={ _ => actions.setSort(sortName) } class={ state.sortFunction == sortName ? `active` : null }>Name</a></td>
                        <td><a onclick={ _ => actions.setSort(sortDate) } class={ state.sortFunction == sortDate ? `active` : null }>Date</a></td>
                    </tr>
                </table>

                <table class='imageTable'>
                    { items.map( item => <ListItem item={item} actions={actions} hovered={ item == state.hoveredItem } />) }
                </table>
            </main>
        )
    },

    actions: {

        hover: (state, actions, item) => {
            return { hoveredItem: item }
        },

        setSort: (state, actions, sortFunction) => {
            if(state.sortFunction == sortFunction) {
                return { sort: state.sort == SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc }
            }
            return { sortFunction: sortFunction }
        },

        search: (state, actions, event) => {
            return { filter: event.target.value.trim().toLowerCase() }
        },

        loadBucket: (state, actions) => {
            s3.listObjectsV2(params, (err, data) => {
                if (err) throw err
                actions.updateItems(data)
            })
        },

        updateItems: (state, actions, data) => {
            return { items: data.Contents.map(obj => ({ name: obj.Key, lastModified: obj.LastModified })) }
        }
    },

    events: {
        init: (state, actions) => {
            actions.loadBucket()
        }
    }
})

