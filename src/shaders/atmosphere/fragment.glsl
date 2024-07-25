uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
    float sunOrientation = dot(uSunDirection, normal);

    // Atmosphere
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color += atmosphereColor;
    // color = mix(color, atmosphereColor, atmosphereDayMix);

    // * Alpha
    //? se precisa que el alpha disminuya muy rapido en los border pero tambien en la noche
    //? alpha 1 cerca al borde y 0.0 en el borde exactamente

    float edgeAlpha = dot(viewDirection, normal);
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);
    // color = vec3(edgeAlpha);//! test

    //?will be high on the day side and low on the night side.
    float dayAlpha = smoothstep(- 0.5, 0.0, sunOrientation);
    // color = vec3(dayAlpha);//! test

    //* Alpha edge + Alpha day
    float alpha= edgeAlpha * dayAlpha;

    // Final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}