/* eslint-disable */
THREE.RenderFragment = {
  	uniforms: {

  		"tDiffuse": { value: null },
  		"tSize":    { value: new THREE.Vector2( 256, 256 ) },
  		"center":   { value: new THREE.Vector2( 0.5, 0.5 ) },
  		"ratio":    { value: 1024.0 },
  		"scale":    { value: 1.0 },
      "frenz":    { value: 1024.0 }

  	},

  	vertexShader: [

  		"varying vec2 vUv;",

  		"void main() {",

  			"vUv = uv;",
  			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

  		"}"

  	].join( "\n" ),

  	fragmentShader: [

  		"uniform vec2 center;",
  		"uniform float scale;",
			"uniform float ratio;",
  		"uniform vec2 tSize;",
  		"uniform sampler2D tDiffuse;",
  		"varying vec2 vUv;",
      "varying float frenz;",

			"float pattern() {",
				"vec2 q = vUv;",
				"float s = sin( 1.57 ), c = cos( 1.57 );",

				"vec2 tex = vUv * tSize - center;",
				"vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * 3.0;",

				"return ( sin( point.x ) * sin( point.y ) ) * 3.0;",

			"}",

  		"void main() {",
				"vec2 q = vUv;",
				"float Pixels = ratio;",
        "float dx = scale * (1.0 / Pixels);",
        "float dy = scale * (1.0 / Pixels);",
        "vec2 Coord = vec2(dx * floor(q.x / dx), dy * floor(q.y / dy));",
  			"vec4 color = texture2D( tDiffuse, Coord);",
				"float average = ( color.r + color.g + color.b ) / 3.0;",
  			"gl_FragColor = vec4(",
					"color.r * 10.0 - 5.0 - pattern(),",
					"color.g * 10.0 - 5.0 - pattern(), ",
					"color.b * 10.0 - 5.0 - pattern(),",
					"color.a",
				");",

  		"}"

  	].join( "\n" )

  };
