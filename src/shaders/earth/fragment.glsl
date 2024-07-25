varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Day / night color
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;

    //? se deben mezclar night and day color, y se necesita un factor de mezcla de 0 (no sol) a 1 (co sol)
    //? basado en la posición (Direction) del sol y la normal, obtengo la orientación del sol 
    //todo:add to GUI /  Sun orientation t

    float sunOrientation = dot(uSunDirection, normal);  //de -1 a 1

    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

    color = mix(nightColor, dayColor, dayMix);

    // Specular cloud color
    //? solo uso red-specular y green-clouds
    vec2 specularCloudColor = texture(uSpecularCloudsTexture, vUv).rg;
    // color = vec3(specularCloudColor, 0.0); //!test

    // * NUBES
    //?se crean nubes blancas mixing: color actual con vec3(1)/ blanco usando el green channel
    // float cloudMix = specularCloudColor.g;
    // color=mix(color, vec3(1.0), cloudMix);

    //! la intensidad de las nubes es muy fuerte
    //? se usa un SMOOTHSTEP  
    // float cloudMix = smoothstep(0.5, 1.0, specularCloudColor.g);
    // color=mix(color, vec3(1.0), cloudMix);

    //! en la noche las nubes se ven muy blancas, 
    //? se van a hacer desaparecer en la noche usando dayMix
    float cloudMix = smoothstep(0.5, 1.0, specularCloudColor.g);
    cloudMix *= dayMix;
    color = mix(color, vec3(1.0), cloudMix);

    // * Fresnel
    //? necesitamos mezclar el gradiente con el color sin reemplarlo por completo
    // float fresnel = dot(viewDirection, normal);
    //! así no se ve porque va de -1 a 1 porque las normales van en el sentido opuesto

    float fresnel = dot(viewDirection, normal) + 1.0;
    //? debemos enviarlo mas a los bordes usando pow()
    fresnel = pow(fresnel, 2.0);
    // color = vec3(fresnel);//! test

    // * Atmosphere
    //? es mas pronunciada a medida que se ve mas al borbe
    //? azul en el día, no se ve en la noche y algo roja en el cambio de luz
    //todo: paramteros en el Script

    //? Vamos a mezclar el color de dia con el de la penumbre usando la orientación del sol
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    //? se mezclan los 2 colores usando esta nueva variable que será un gradiente de color
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    // color = atmosphereColor; //!test
    //todo: fresnel first

    // * FERNEL + ATMOSFERA
    // color = mix(color, atmosphereColor, fresnel);
    //! es muy visible en la noche , se puede usar atmosphereDayMix
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);

    // * SPECULAR | reflexión 
    //? vamos a hacer lo mismo que se hizo en la directional light shader
    //? Necesitamos el vector de reflexión del sol, usando reflect
    vec3 reflection = reflect(-uSunDirection, normal); //-uSun porque va al reves
    //? si la reflection y la viewDirection estan alineados necesitamos un valor mayor, menor dlc
    float specular = -dot(reflection, viewDirection); //usamos -dot porque queremos lo contrario
    specular = max(specular, 0.0);
    specular = pow(specular, 32.0); // hacerla mes pequeña y concentrada
    // color= vec3(specular); //!test
    // color += specular;

    //! Queremos que el specular tenga el color de la atmósfera no un punto blanco
    //! pero solo cuando está en lo bordes, usamos el FRESNEL para mezclar los colores

    //? para usar el canal rojo del maopa specular
    specular *= specularCloudColor.r;
    
    vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
    // color = specularColor; //!test
     color += specular * specularColor;


    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}