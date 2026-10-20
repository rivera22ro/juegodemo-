
const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

const marcador = document.getElementById("marcador");
const mensaje = document.getElementById("mensaje");
const barraEnergia = document.getElementById("barraEnergia");
const botonReiniciar = document.getElementById("reiniciar");
const barraVida = document.getElementById("barraVida");
const textoVida = document.getElementById("textoVida");
const joystick = document.getElementById("joystick");
const joystickNucleo = document.getElementById("joystickNucleo");
const botonDisparo = document.getElementById("botonDisparo");

const jugador = {
    x: 50,
    y: 50,
    tamano: 36,
    velocidad: 8
};

const cristal = {
    x: 200,
    y: 200,
    tamano: 18
};

const teclas = {}; 


let direccion = { x: 0, y: -1 };

let disparos = [];


let oleada = 1;
let enemigos = [crearEnemigo(600, 250)];

function crearEnemigo(x, y) {
    return {
        x,
        y,
        tamano: 36,
        vida: 5,
        activo: true,
        velocidad: 1
    };
}

function crearOleada(cantidad) {
    enemigos = [];
    for (let i = 0; i < cantidad; i++) {
        // Aparecen en posiciones distribuidas y lejos del jugador.
        let x, y;
        do {
            x = Math.random() * (canvas.width - 50) + 10;
            y = Math.random() * (canvas.height - 50) + 10;
        } while (Math.hypot(x - jugador.x, y - jugador.y) < 140);
        enemigos.push(crearEnemigo(x, y));
    }
}


let vidaJugador = 100;
let proximoDisparo = 0;
let invulnerableHasta = 0;


let puntos = 0;
let victoria = false;

function crearCristal() {
    cristal.x = Math.random() * (canvas.width - cristal.tamano);
    cristal.y = Math.random() * (canvas.height - cristal.tamano);
}
    

function dibujarJugador() {
    // Centro del personaje
    const cx = jugador.x + jugador.tamano / 2;
    const cy = jugador.y + jugador.tamano / 2;

    // Pequeño movimiento al caminar
    const moviendo =
        teclas["ArrowUp"] ||
        teclas["ArrowDown"] ||
        teclas["ArrowLeft"] ||
        teclas["ArrowRight"] ||
        teclas["touchUp"] ||
        teclas["touchDown"] ||
        teclas["touchLeft"] ||
        teclas["touchRight"];

    const paso = moviendo
        ? Math.sin(Date.now() / 80) * 2
        : 0;

    ctx.save();

    // 1. Sombra debajo del explorador
    ctx.fillStyle = "#050b16";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 7, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Piernas de la armadura
    ctx.fillStyle = "#243c58";

    ctx.fillRect(cx - 10, cy + 2 + paso, 7, 10);
    ctx.fillRect(cx + 3, cy + 2 - paso, 7, 10);

    // 3. Mochila tecnológica
    ctx.shadowColor = "#42e8f5";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#087eaa";
    ctx.fillRect(cx - 13, cy - 7, 6, 15);

    // Núcleo de energía de la mochila
    ctx.fillStyle = "#65ff9a";
    ctx.fillRect(cx - 12, cy - 3, 4, 6);

    // 4. Torso con armadura
    ctx.fillStyle = "#1674d1";
    ctx.fillRect(cx - 8, cy - 10, 16, 19);

    // Panel luminoso del pecho
    ctx.fillStyle = "#42e8f5";
    ctx.fillRect(cx - 3, cy - 6, 6, 4);

    // 5. Casco
    ctx.fillStyle = "#b9d7ec";
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Visor oscuro
    ctx.fillStyle = "#10263f";
    ctx.fillRect(cx - 7, cy - 15, 14, 6);

    // Reflejo de neón en el visor
    ctx.fillStyle = "#42e8f5";
    ctx.fillRect(cx - 4, cy - 13, 8, 2);

    ctx.restore();
}
    
function dibujarCristal() {
    const centroX = cristal.x + cristal.tamano / 2;
    const centroY = cristal.y + cristal.tamano / 2;

    ctx.save();

    // Efecto de luz verde
    ctx.shadowColor = "#65ff9a";
    ctx.shadowBlur = 30;

    // Forma de diamante
    ctx.fillStyle = "#65ff9a";
    ctx.beginPath();
    ctx.moveTo(centroX, cristal.y);
    ctx.lineTo(cristal.x + cristal.tamano, centroY);
    ctx.lineTo(centroX, cristal.y + cristal.tamano);
    ctx.lineTo(cristal.x, centroY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


function actualizarJuego() {
    if (victoria) return;

    if (teclas["ArrowUp"]) {
        jugador.y -= jugador.velocidad;
        direccion = { x: 0, y: -1 };
    }

    if (teclas["ArrowDown"]) {
        jugador.y += jugador.velocidad;
        direccion = { x: 0, y: 1 };
    }

    if (teclas["ArrowLeft"]) {
        jugador.x -= jugador.velocidad;
        direccion = { x: -1, y: 0 };
    }

    if (teclas["ArrowRight"]) {
        jugador.x += jugador.velocidad;
        direccion = { x: 1, y: 0 };
    }

    // Movimiento adicional desde el joystick táctil.
    if (teclas["touchUp"]) {
        jugador.y -= jugador.velocidad;
    }
    if (teclas["touchDown"]) {
        jugador.y += jugador.velocidad;
    }
    if (teclas["touchLeft"]) {
        jugador.x -= jugador.velocidad;
    }
    if (teclas["touchRight"]) {
        jugador.x += jugador.velocidad;
    }

    jugador.x = Math.max(
        0,
        Math.min(canvas.width - jugador.tamano, jugador.x)
    );

    jugador.y = Math.max(
        0,
        Math.min(canvas.height - jugador.tamano, jugador.y)
    );

    comprobarColision();
}


function actualizarEnemigo() {
    if (victoria) return;

    for (const enemigo of enemigos) {
        if (!enemigo.activo) continue;
        const centroJugadorX = jugador.x + jugador.tamano / 2;
        const centroJugadorY = jugador.y + jugador.tamano / 2;
        const centroEnemigoX = enemigo.x + enemigo.tamano / 2;
        const centroEnemigoY = enemigo.y + enemigo.tamano / 2;
        const diferenciaX = centroJugadorX - centroEnemigoX;
        const diferenciaY = centroJugadorY - centroEnemigoY;
        const distancia = Math.hypot(diferenciaX, diferenciaY);

        if (distancia > 1) {
            enemigo.x += (diferenciaX / distancia) * enemigo.velocidad;
            enemigo.y += (diferenciaY / distancia) * enemigo.velocidad;
        }
    }
}


function comprobarColision() {
    const tocaCristal =
        jugador.x < cristal.x + cristal.tamano &&
        jugador.x + jugador.tamano > cristal.x &&
        jugador.y < cristal.y + cristal.tamano &&
        jugador.y + jugador.tamano > cristal.y;

    if (tocaCristal) {
        puntos++;
        marcador.textContent = `Cristales recogidos: ${puntos}`;
        // La barra se llena y vuelve a empezar cada 10 cristales; la partida continúa.
        barraEnergia.style.width = ((puntos % 10 || 10) * 10) + "%";
        crearCristal();
        mensaje.textContent = puntos % 10 === 0
            ? `¡${puntos} cristales recogidos! Sigue luchando.`
            : "¡Buen trabajo! Busca el siguiente cristal.";
    }
}


function dibujarDisparos() {
    ctx.save();

    ctx.fillStyle = "#65ff9a";
    ctx.shadowColor = "#65ff9a";
    ctx.shadowBlur = 15;

    for (const disparo of disparos) {
        ctx.fillRect(disparo.x - 5, disparo.y - 5, 10, 10);
    }

    ctx.restore();
}



function disparar() {
    const ahora = Date.now();

    if (ahora < proximoDisparo) return;

    if (victoria) return;

    disparos.push({

        x: jugador.x + jugador.tamano / 2,
        y: jugador.y + jugador.tamano / 2,
        vx: direccion.x * 7,
        vy: direccion.y * 7

    });

    console.log("Proyectil creado:", disparos.length);

    proximoDisparo = ahora + 250;
}


function actualizarDisparos() {
    for (const disparo of disparos) {
        disparo.x += disparo.vx;
        disparo.y += disparo.vy;
    }

    disparos = disparos.filter(disparo =>
        disparo.x >= 0 &&
        disparo.x <= canvas.width &&
        disparo.y >= 0 &&
        disparo.y <= canvas.height
    );
}


function dibujarEnemigo(enemigo) {
    if (!enemigo.activo) return;
    const cx = enemigo.x + enemigo.tamano / 2;
    const cy = enemigo.y + enemigo.tamano / 2;
    const pulso = 0.85 + Math.sin(Date.now() / 130 + enemigo.x) * 0.15;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulso, 1);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 19, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#251344";
    const patas = [[-10,-3,-19,-13],[-12,3,-20,10],[10,-3,19,-13],[12,3,20,10],[-5,7,-10,17],[5,7,10,17]];
    for (const pata of patas) {
        ctx.beginPath(); ctx.moveTo(pata[0],pata[1]); ctx.lineTo(pata[2],pata[3]);
        ctx.lineTo(pata[0] + (pata[2] < 0 ? 5 : -5), pata[1] + 5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#8c4bd1"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    ctx.shadowColor = "#a34cff"; ctx.shadowBlur = 13;
    ctx.fillStyle = "#54228c"; ctx.strokeStyle = "#b77aff"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,-19); ctx.lineTo(13,-12); ctx.lineTo(17,0); ctx.lineTo(10,12);
    ctx.lineTo(0,16); ctx.lineTo(-10,12); ctx.lineTo(-17,0); ctx.lineTo(-13,-12); ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.shadowBlur = 0; ctx.fillStyle = "#7b39bd";
    ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(7,-8); ctx.lineTo(0,1); ctx.lineTo(-7,-8); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = "#d4a0ff"; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = "#30114f";
    ctx.beginPath(); ctx.moveTo(-5,7); ctx.lineTo(-10,15); ctx.lineTo(-2,12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5,7); ctx.lineTo(10,15); ctx.lineTo(2,12); ctx.closePath(); ctx.fill();

    ctx.shadowColor = "#65ff9a"; ctx.shadowBlur = 12; ctx.fillStyle = "#65ff9a";
    ctx.beginPath();
    ctx.ellipse(-6,-2,3.5,5,-0.25,0,Math.PI*2); ctx.ellipse(6,-2,3.5,5,0.25,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#eaffc5"; ctx.beginPath();
    ctx.arc(-6,-3,1.2,0,Math.PI*2); ctx.arc(6,-3,1.2,0,Math.PI*2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#481b2b";
    ctx.fillRect(enemigo.x, enemigo.y - 12, enemigo.tamano, 5);
    ctx.fillStyle = "#ff3155";
    ctx.fillRect(enemigo.x, enemigo.y - 12, enemigo.tamano * enemigo.vida / 5, 5);
}

function comprobarImpactos() {
    for (const disparo of disparos) {
        if (disparo.x < 0) continue;
        for (const enemigo of enemigos) {
            if (!enemigo.activo) continue;
            const impacto =
                disparo.x >= enemigo.x && disparo.x <= enemigo.x + enemigo.tamano &&
                disparo.y >= enemigo.y && disparo.y <= enemigo.y + enemigo.tamano;
            if (!impacto) continue;

            enemigo.vida--;
            disparo.x = -100;
            disparo.y = -100;
            if (enemigo.vida <= 0) {
                enemigo.activo = false;
                mensaje.textContent = "¡Enemigo derrotado!";
            }
            break;
        }
    }

    // Cuando cae el último enemigo, comienza una oleada con el doble.
    if (!victoria && enemigos.length > 0 && enemigos.every(e => !e.activo)) {
        oleada++;
        const cantidad = Math.pow(2, oleada - 1);
        crearOleada(cantidad);
        mensaje.textContent = `¡Oleada ${oleada}! Han aparecido ${cantidad} enemigos.`;
    }
}


function dibujarFondo() {
    // Fondo principal
    ctx.fillStyle = "#0b1424";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula tecnológica
    ctx.strokeStyle = "#1b3550";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Paneles tecnológicos del suelo
    for (let x = 20; x < canvas.width; x += 160) {
        for (let y = 20; y < canvas.height; y += 120) {
            ctx.fillStyle = "#14283c";
            ctx.fillRect(x, y, 60, 40);

            ctx.strokeStyle = "#28516b";
            ctx.strokeRect(x, y, 60, 40);

            ctx.fillStyle = "#167a9a";
            ctx.fillRect(x + 8, y + 8, 12, 3);
        }
    }

    // Luces de neón animadas
    const brillo = 0.5 + Math.sin(Date.now() / 300) * 0.5;

    ctx.globalAlpha = brillo;
    ctx.fillStyle = "#42e8f5";
    ctx.shadowColor = "#42e8f5";
    ctx.shadowBlur = 12;

    ctx.fillRect(0, 0, canvas.width, 3);
    ctx.fillRect(0, canvas.height - 3, canvas.width, 3);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}




function comprobarContacto() {
    if (victoria) return;
    const ahora = Date.now();
    if (ahora < invulnerableHasta) return;

    const enemigoEnContacto = enemigos.find(enemigo => enemigo.activo &&
        jugador.x < enemigo.x + enemigo.tamano &&
        jugador.x + jugador.tamano > enemigo.x &&
        jugador.y < enemigo.y + enemigo.tamano &&
        jugador.y + jugador.tamano > enemigo.y);
    if (!enemigoEnContacto) return;

    vidaJugador = Math.max(0, vidaJugador - 10);
    invulnerableHasta = ahora + 1000;
    barraVida.style.width = vidaJugador + "%";
    textoVida.textContent = `Vida: ${vidaJugador} / 100`;

    if (vidaJugador <= 0) {
        victoria = true;
        mensaje.textContent = "¡Has sido derrotado! Pulsa Volver a jugar.";
    }
}


function dibujarJuego() {
    dibujarFondo();
    dibujarCristal();
    dibujarJugador();
}



function bucleJuego() {
    actualizarJuego();
    if (teclas["Space"]) disparar();
    actualizarEnemigo();
    actualizarDisparos();
    comprobarImpactos();
    comprobarContacto();

    dibujarFondo();
    dibujarCristal();
    for (const enemigo of enemigos) dibujarEnemigo(enemigo);
    dibujarDisparos();
    dibujarJugador();

    requestAnimationFrame(bucleJuego);
}




document.addEventListener("keydown", function(evento) {
    if ([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight"
    ].includes(evento.key)) {
        evento.preventDefault();
        teclas[evento.key] = true;
    }

    if (evento.code === "Space") {
        evento.preventDefault();
        console.log("¡Barra espaciadora detectada!");
        teclas["Space"] = true;
        disparar();
    }
});

document.addEventListener("keyup", function(evento) {
    teclas[evento.key] = false;

    if (evento.code === "Space") {
        teclas["Space"] = false;
    }
});

// Joystick virtual para mover al jugador con el dedo.
let joystickActivo = false;
const radioJoystick = 42;

function actualizarJoystick(evento) {
    const rect = joystick.getBoundingClientRect();
    const centroX = rect.left + rect.width / 2;
    const centroY = rect.top + rect.height / 2;
    let dx = evento.clientX - centroX;
    let dy = evento.clientY - centroY;
    const distancia = Math.hypot(dx, dy);
    if (distancia > radioJoystick) {
        dx = dx / distancia * radioJoystick;
        dy = dy / distancia * radioJoystick;
    }
    joystickNucleo.style.transform = `translate(${dx}px, ${dy}px)`;
    teclas["touchLeft"] = dx < -10;
    teclas["touchRight"] = dx > 10;
    teclas["touchUp"] = dy < -10;
    teclas["touchDown"] = dy > 10;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        direccion = { x: dx < 0 ? -1 : 1, y: 0 };
    } else if (Math.abs(dy) > 10) {
        direccion = { x: 0, y: dy < 0 ? -1 : 1 };
    }
}
function soltarJoystick() {
    joystickActivo = false;
    teclas["touchLeft"] = false;
    teclas["touchRight"] = false;
    teclas["touchUp"] = false;
    teclas["touchDown"] = false;
    joystickNucleo.style.transform = "translate(0, 0)";
}
joystick.addEventListener("pointerdown", function(evento) {
    evento.preventDefault();
    joystickActivo = true;
    joystick.setPointerCapture(evento.pointerId);
    actualizarJoystick(evento);
});
joystick.addEventListener("pointermove", function(evento) {
    if (!joystickActivo) return;
    evento.preventDefault();
    actualizarJoystick(evento);
});
joystick.addEventListener("pointerup", soltarJoystick);
joystick.addEventListener("pointercancel", soltarJoystick);
joystick.addEventListener("lostpointercapture", soltarJoystick);

// Mantener pulsado permite disparar repetidamente.
botonDisparo.addEventListener("pointerdown", function(evento) {
    evento.preventDefault();
    botonDisparo.setPointerCapture(evento.pointerId);
    teclas["Space"] = true;
    disparar();
});
function soltarDisparo() { teclas["Space"] = false; }
botonDisparo.addEventListener("pointerup", soltarDisparo);
botonDisparo.addEventListener("pointercancel", soltarDisparo);
botonDisparo.addEventListener("lostpointercapture", soltarDisparo);
botonDisparo.addEventListener("contextmenu", evento => evento.preventDefault());

botonReiniciar.addEventListener("click", function() {
    jugador.x = 50;
    jugador.y = 50;

    puntos = 0;
    victoria = false;

    vidaJugador = 100;
    invulnerableHasta = 0;

    oleada = 1;
    enemigos = [crearEnemigo(600, 250)];

    disparos = [];
    teclas["Space"] = false;
    soltarJoystick();

    marcador.textContent = "Cristales recogidos: 0";
    mensaje.textContent = "¡Recoge cristales y derrota a los enemigos!";

    barraEnergia.style.width = "0%";
    barraVida.style.width = "100%";
    textoVida.textContent = "Vida: 100 / 100";

    crearCristal();
});

crearCristal();
bucleJuego();
