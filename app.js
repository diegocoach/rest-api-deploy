const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const cors = require('cors')
const app = express()
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js')

app.use(express.json()) //Esto nos permite usar el req.body para recuperar datos de las peliculas
//Hay un middleware de CORS que se puede usar
app.use(cors({
  origin: (origin, callback) =>{
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'http://localhost:3000',
      'http://movies.com.ar',
      'http://midu.dev',
    
    ]
    if(ACCEPTED_ORIGINS.includes(origin)){
      return callback(null, true)
    }
    if(!origin){
      return callback(null, true)
    }
    return callback(new Error('Not allow by CORS')) //si no esta dentro de los origin permitidos, error
  }

}
)) //Cuidado con esto porque va a poner todo con un *
app.disable('x-powered-by')

app.get('/', (req, res) =>{
  //Para que el cliente pueda elegir la representacion, leer el query param de format
  const format = req.query.format
  if(format === 'xml'){
    res.send('<h1>Hola mundo</h1>')
  }
  res.json({ message: 'Hola mundo' })
})

//El CORS se puede dificular dependiendo del metodo:
//Metodos normales: GET/HEAD/POST
//Metodos complejos: PUT/PATCH/DELETE tienen CORS PRE-flight que requieren una peticion especial que se llama OPTIONS, que va a preguntarle a la api usando el verbo OPTIONS: antes de hacer este metodo, podremos hacerlo? --> esto se hace con app.options

//Esto se puede meter dentro del middleware Cors para darle opciones, y que no ponga *
// const ACCEPTED_ORIGINS = [
//   'http://localhost:8080',
//   'http://localhost:1234',
//   'http://localhost:3000',
//   'http://movies.com',
//   'http://midu.dev',

// ]

app.get('/movies', (req, res) =>{
  //Podemos hacer que solo este endpoint tenga acceso a la url y no producir un error CORS
 // res.header('Access-Control-Allow-Origin', '*') //Con el * le estoy diciendo que todos los dominios que no sean enuestro propio origen estan permitidos
  const origin = req.header('origin') //Aca recupero quien me envia la peticion
  //La cabecera no te la envia el navegador cuando el origin es quien hace la propia peticion.
  if (ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()) // usamos metodo some para poder usar el lowercase para filtrar
    )
    return res.json(filteredMovies)
    
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) =>{ //path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id);
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found'})
})

app.post('/movies', (req, res) =>{
  const result = validateMovie(req.body)
  //Todo esto se quita y se valida aqui
  // const {
  //   title,
  //   genre,
  //   year,
  //   director,
  //   duration,
  //   rate,
  //   poster
  // } = req.body
  if (!result.success){
    //Tambien podriamos usar status 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) }) //400 el cliente ha cometido un error en la request 
  }

  //Hay que hacer las validaciones de los datos para verificar que los datos que me mandan son correctos

  //En base de datos
  const newMovie ={
    id: crypto.randomUUID(), //nuevo ID version 4
    ...result.data //Aqui si podemos usar esto porque solo llegaran los datos que haya sido validados y no cualquier dato
    // title,
    // genre,
    // director,
    // year,
    // duration,
    // rate: rate ?? 0,
    // poster
  }
  //Esto no es REST porque estamos guardando el estado de la aplicacion en memoria
  movies.push(newMovie)
  res.status(201).json(newMovie) //Codigo 201 pasa avisar que el recurso fue creado
})

app.delete('/movies/:id', (req, res) =>{
  const origin = req.header('origin')
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if(movieIndex === -1){
    return res.status(404).json({ message: 'Movie not found' })
  }
  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) =>{
  console.log(req.params)
  
  const result = validatePartialMovie(req.body)
  if(!result.success){ 
    return res.status(404).json({ error: JSON.parse(result.error.message) })
}
  
  const { id } = req.params;
 
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie;

  return res.json(updateMovie)
});

app.options('/movies/:id', (req, res) =>{
  const origin = req.header('origin')
  if(ACCEPTED_ORIGINS.includes(origin) || !origin){
    res.header('Access-Control-Allow-Origin', origin)
    //Aqui tambien hay que pasarle una cabecera que indique los metodos que puede usar
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
})

const PORT = process.env.PORT ?? 1234
app.listen(PORT, () =>{
  console.log(`server listening on port http://localhost:${PORT}`)
})

app.get('/movies', (req, res) =>{
  res.status(200).json(movies)
})


// REST API : REPRESENTIONAL STATE TRANSFER, es una ARQUITECTURA DE SOFTWARE (2000 - Roy Fielding)
//Principios: escalabilidad, simplicidad, visibilidad, portabilidad, fiabilidad, facil de modificar.
//Fundamentos:
//Resources: puede ser un usuario, un libro, una biblioteca. Cada uno se identifia con un url
//Metodos: verbos http (put, get, patch, etc)
//Representaciones: JSON, XLM, HTML, etc. El cliente deberia poder decidir la representacion del recurso
//Stateless: cada solicitud debe contener toda la informacion requerida, para que no sostenga ningun estado (guardar datos en el servidor) entre el servidor y el cliente
//Interfaz uniforme
//Separacion de conceptos: que cliente y servidor evolucionen de forma separada

//Idempotente: propiedad de realizar una accion determinada varias veces y aun asi conseguir siempre el mismo resultado que se obtendria al hacerlo una vez
//POST crea un nuevo elemento/recurso en el servidor --> /movies --> no es idempotente porque cada vez va a crear un recurso nuevo
//PUT actualiza totalmente un elemento ya existente o crearlo si no existe --> /movies/123-456-789 --> es idempotente
//PATCH actualiar parcialmente un elemento/recurso -->/movies/123-456-789 --> es idempotente pero depende del updateAT.

