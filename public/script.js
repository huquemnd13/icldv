let decodedToken; // Declara la variable en el ámbito global
      let cicloActivoGlobal; // Declara una variable global para el ciclo activo
      let materiaSeleccionadaId; // Variable global para el ID de la materia seleccionada
      let textoMateriaSeleccionada; // Variable global para el texto de la materia seleccionada
      let calificacionIdSeleccionada; // Variable global para el id de la calificacion a actualizar

      // Decodificar el token y mostrar el nombre del profesor
      window.onload = async function () {
        const token = localStorage.getItem("token"); // Obtén el token del localStorage

        if (token) {
          try {
            decodedToken = jwt_decode(token); // Decodifica el token y asigna a la variable global
            const nombreProfesor =
              decodedToken.nombre_completo ||
              "Campo nombre_completo no encontrado";
            document.getElementById("nombre_usuario").textContent =
              nombreProfesor; // Muestra el nombre en el span

            // Añadir event listener para cargar alumnos al hacer clic en el botón
            document
              .getElementById("cargar-alumnos-button")
              .addEventListener("click", cargarAlumnos);

            // Hacer petición al servidor para obtener el ciclo escolar activo
            const responseCiclo = await fetch("/obtener-ciclos-escolares", {
              headers: {
                Authorization: `Bearer ${token}`, // Envía el token en los headers
              },
            });

            if (responseCiclo.ok) {
              const cicloActivo = await responseCiclo.json(); // Obtiene el ciclo activo en formato JSON
              cicloActivoGlobal = cicloActivo; // Asigna el ciclo activo a la variable global

              // Asegúrate de que el elemento span para el ciclo activo esté presente
              const cicloActivoSpan = document.getElementById("ciclo_activo");

              // Mostrar el ciclo activo en el DOM
              cicloActivoSpan.textContent = `Ciclo: ${cicloActivo.inicio_ciclo} - ${cicloActivo.fin_ciclo}`; // Muestra el ciclo activo
            } else {
              console.error("Error al obtener el ciclo escolar activo.");
            }

            // Hacer petición al servidor para obtener los grados del profesor
            const responseGrados = await fetch("/obtener-grados-profesor", {
              headers: {
                Authorization: `Bearer ${token}`, // Envía el token en los headers
              },
            });

            if (responseGrados.ok) {
              const grados = await responseGrados.json(); // Obtiene los grados en formato JSON
              const selectGrados = document.getElementById("grados");

              // Llenar el dropdown de grados
              grados.forEach((grado) => {
                const option = document.createElement("option");
                option.value = grado.id; // Usa el ID del grado como valor
                option.textContent = grado.descripcion; // Usa la descripción del grado como texto
                selectGrados.appendChild(option); // Añadir opción al select
              });
            } else {
              console.error("Error al obtener los grados.");
            }

            // Listener para el cambio en el dropdown
            document
              .getElementById("grados")
              .addEventListener("change", async (event) => {
                const gradoId = event.target.value; // Obtén el ID del grado seleccionado
                // Verifica que se haya seleccionado un grado
                if (gradoId) {
                  try {
                    const response = await fetch(
                      `/obtener-materias-profesor-grado?grado_id=${gradoId}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`, // Envía el token en los headers
                        },
                      }
                    );

                    if (response.ok) {
                      const materias = await response.json(); // Obtén las materias en formato JSON
                      // Imprimir las materias en la consola
                      const selectMaterias =
                        document.getElementById("materias");
                      selectMaterias.innerHTML = "";

                      // Agregar la opción por defecto
                      const defaultOption = document.createElement("option");
                      defaultOption.value = ""; // O '0' si deseas un valor por defecto
                      defaultOption.textContent = "Selecciona una materia";
                      defaultOption.disabled = true; // Deshabilitar opción por defecto
                      defaultOption.selected = true; // Seleccionarla como la opción por defecto
                      selectMaterias.appendChild(defaultOption); // Añadir la opción por defecto

                      // Agregar las materias obtenidas al select
                      materias.forEach((materia) => {
                        const option = document.createElement("option");
                        option.value = materia.materia_id; // ID de la materia
                        option.textContent = materia.materia_nombre; // Nombre de la materia
                        selectMaterias.appendChild(option); // Añadir la opción al select
                      });
                      // Listener para capturar la materia seleccionada
                      document
                          .getElementById("materias")
                          .addEventListener("change", (event) => {
                            const selectMateria = event.target; // El elemento select que disparó el evento
                            materiaSeleccionadaId = selectMateria.value; // Guarda el ID de la materia seleccionada
                            textoMateriaSeleccionada = selectMateria.options[selectMateria.selectedIndex].text; // Obtiene el texto de la opción seleccionada
                          });
                    } else {
                      console.error(
                        "Error al obtener materias:",
                        response.statusText
                      );
                    }
                  } catch (err) {
                    console.error("Error en la solicitud:", err);
                  }
                } else {
                }
              });
          } catch (error) {
            console.error(
              "Error al decodificar el token o al obtener grados:",
              error
            );
          }
        } else {
          // Si no hay token, redirige al usuario al login u otra acción
          window.location.href = "/login.html"; // Redirige a la página de login
        }
      };
      
      // Función para crear un dropdown con las calificaciones
      function createCalificacionDropdown(
        calificacion,
        tiempos,
        tiempoIndex,
        currentDateTime
      ) {
        const select = document.createElement("select");
        select.classList.add("calificacion-dropdown");

        // Obtén el tiempo correspondiente
        const tiempo = tiempos[tiempoIndex];

        // Habilitar o deshabilitar el dropdown según la vigencia
        if (
          tiempo &&
          currentDateTime >= new Date(tiempo.fecha_inicio) &&
          currentDateTime <= new Date(tiempo.fecha_fin)
        ) {
          select.disabled = false; // Habilitar
        } else {
          select.disabled = true; // Deshabilitar
        }

        for (let i = 0; i <= 10; i++) {
          const option = document.createElement("option");
          option.value = i; // Valor de la opción
          option.textContent = i; // Texto que se mostrará
          if (calificacion === i) {
            option.selected = true; // Marca como seleccionado si coincide con la calificación
          } else if (!calificacion && i === 0) {
            option.selected = true; // Selecciona 0 si no hay calificación
          }
          select.appendChild(option); // Agrega la opción al dropdown
        }

        return select; // Devuelve el elemento select creado
      }

      // Función para cargar los alumnos según el grado y ciclo escolar seleccionados
        let observacionesGlobales = []; // Variable global para almacenar observaciones

        async function cargarAlumnos() {
          const token = localStorage.getItem("token"); // Obtener el token del almacenamiento local
          if (token) {
              try {
                  const gradoId = document.getElementById("grados").value; // Obtener el ID del grado seleccionado
                  const cicloId = cicloActivoGlobal.id; // Obtener el ID del ciclo seleccionado
                  const profesorId = decodedToken.id_profesor; // Obtener el ID del profesor desde el token

                  // Verificar que ambos valores están seleccionados
                  if (!gradoId || !materiaSeleccionadaId || !profesorId) {
                      console.error("Por favor selecciona un grado y un ciclo escolar.");
                      return;
                  }

                  // Obtener detalles de las calificaciones desde el nuevo endpoint
                  const response = await fetch(
                      `/calificaciones?id_ciclo_escolar=${cicloId}&id_grado_nivel_escolar=${gradoId}&id_profesor=${profesorId}&id_materia=${materiaSeleccionadaId}`,
                      {
                          method: 'GET',
                          headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}` // Incluir el token aquí
                          }
                      }
                  );

                  // Manejar respuesta de calificaciones
                  if (!response.ok) {
                      if (response.status === 401) {
                          alert('No estás autorizado. Por favor, inicia sesión nuevamente.');
                          return;
                      }
                      throw new Error('Error al obtener las calificaciones.');
                  }

                  const calificaciones = await response.json();

                  // Obtener los periodos
                  const responsePeriodos = await fetch(`/periodos?id_ciclo_escolar=${cicloId}`, {
                      method: 'GET',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` // Incluir el token aquí
                      }
                  });

                  // Manejar respuesta de periodos
                  if (!responsePeriodos.ok) {
                      if (responsePeriodos.status === 401) {
                          alert('No estás autorizado. Por favor, inicia sesión nuevamente.');
                          return;
                      }
                      throw new Error('Error al obtener los periodos.');
                  }

                  const periodos = await responsePeriodos.json();

                  // Obtener las observaciones solo una vez y almacenarlas en la variable global
                  if (observacionesGlobales.length === 0) {
                      observacionesGlobales = await cargarObservaciones(materiaSeleccionadaId); // Llamada para cargar las observaciones
                  }

                  // Buscar el periodo activo
                  const periodoActivo = periodos.find((periodo) => esPeriodoActivo(periodo));
                  if (periodoActivo) {
                      mostrarToast(
                          `Periodo de captura activo: Desde ${new Date(periodoActivo.fecha_inicio).toLocaleDateString()} hasta ${new Date(periodoActivo.fecha_fin).toLocaleDateString()}`,
                          "success"
                      );
                  } else {
                      mostrarToast("No hay ningún periodo de captura activo en este momento.", "warning");
                  }

                  const tableBody = document.getElementById("alumnos-table").querySelector("tbody");
                  tableBody.innerHTML = ""; // Limpiar el cuerpo de la tabla

                  // Para cada calificación recibida
                  for (const calificacion of calificaciones) {
                      const row = document.createElement("tr");

                      // Celdas de calificación, alumno y nombre
                      const cellCalificacionId = document.createElement("td");
                      cellCalificacionId.textContent = calificacion.id_calificacion;
                      row.appendChild(cellCalificacionId);

                      const cellAlumnoId = document.createElement("td");
                      cellAlumnoId.textContent = calificacion.id_alumno;
                      row.appendChild(cellAlumnoId);

                      const cellMateria = document.createElement("td");
                      cellMateria.textContent = textoMateriaSeleccionada;
                      row.appendChild(cellMateria);

                      const cellNombreCompleto = document.createElement("td");
                      cellNombreCompleto.textContent = calificacion.nombre_completo;
                      row.appendChild(cellNombreCompleto);

                      // Crear dropdowns de calificación para cada periodo
                      const cellP1 = document.createElement("td");
                      cellP1.dataset.periodo = 1; // Establecer data-periodo para el periodo 1
                      cellP1.appendChild(crearDropdown(calificacion.periodo_1, periodos[0], 1)); // Pasar periodo 1
                      row.appendChild(cellP1);

                      const cellP2 = document.createElement("td");
                      cellP2.dataset.periodo = 2; // Establecer data-periodo para el periodo 2
                      cellP2.appendChild(crearDropdown(calificacion.periodo_2, periodos[1], 2)); // Pasar periodo 2
                      row.appendChild(cellP2);

                      const cellP3 = document.createElement("td");
                      cellP3.dataset.periodo = 3; // Establecer data-periodo para el periodo 3
                      cellP3.appendChild(crearDropdown(calificacion.periodo_3, periodos[2], 3)); // Pasar periodo 3
                      row.appendChild(cellP3);

                      // Crear la celda y el select
                      const cellObservacion = document.createElement("td");
                      const selectObservacion = document.createElement("select");
                      selectObservacion.multiple = true; // Hacer el select múltiple
                      selectObservacion.size = 6; // Limitar a 6 opciones visibles
                      selectObservacion.dataset.alumno = calificacion.id_alumno; // Almacenar el id del alumno como referencia
                      selectObservacion.dataset.calificacion = calificacion.id_calificacion; // Almacenar el id de calificación

                      // Llenar el select con las observaciones obtenidas
                      llenarSelectConObservaciones(selectObservacion, observacionesGlobales);
                      cellObservacion.appendChild(selectObservacion);
                      row.appendChild(cellObservacion); // Agregar la celda de observaciones a la fila

                      // Evento para controlar la selección y limitar a 2 opciones
                      selectObservacion.addEventListener("change", async function () {
                          // Obtén todas las opciones seleccionadas
                          const selectedOptions = Array.from(selectObservacion.options).filter(opt => opt.selected);
                          // Si ya hay más de 2 seleccionadas, restablece la selección
                          if (selectedOptions.length > 2) {
                              // Desmarca la última opción seleccionada
                              const lastSelectedOption = selectedOptions[selectedOptions.length - 1];
                              lastSelectedOption.selected = false; // Desmarca la opción más reciente
                              mostrarToast("Solo puedes seleccionar hasta 2 opciones.", "error");
                          } else {
                              // Obtener el ID de calificación directamente del dataset
                              const calificacionIdSeleccionada = parseInt(selectObservacion.dataset.calificacion); // Asegúrate de que este dato esté disponible

                              // Obtener las observaciones seleccionadas
                              const observacionesSeleccionadas = selectedOptions.map(opt => opt.value);
                              // Llama a la función para guardar las observaciones seleccionadas
                              if (observacionesSeleccionadas.length > 0) {
                                  try {
                                      await guardarObservacionesSeleccionadas(calificacionIdSeleccionada, observacionesSeleccionadas);
                                      mostrarToast("Observaciones guardadas exitosamente.", "success"); // Mensaje de éxito
                                  } catch (error) {
                                      console.error("Error al guardar observaciones:", error);
                                      mostrarToast("Error al guardar observaciones.", "error"); // Mensaje de error
                                  }
                              }
                          }
                      });

                      // Llamar a manejarTooltip para el select de observaciones
                      manejarTooltip(selectObservacion);

                      // Agregar fila al cuerpo de la tabla
                      tableBody.appendChild(row);
                  }
              } catch (error) {
                  console.error("Error al cargar los alumnos:", error);
              }
          } else {
              console.error("No hay token disponible. Por favor inicia sesión.");
          }
      }


      
        // Función para obtener las observaciones desde el servidor una sola vez
        async function cargarObservaciones(idMateria) {
            if (observacionesGlobales.length === 0) {
                const token = localStorage.getItem("token"); // Obtén el token del localStorage
                const response = await fetch(`/obtener-observaciones-materia?id_materia=${idMateria}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}` // Asegúrate de que el token aquí es válido
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error al obtener observaciones: ${response.status}`);
                }

                observacionesGlobales = await response.json();
            }
            return observacionesGlobales;
        }

        // Función para llenar los select con las observaciones ya obtenidas
        function llenarSelectConObservaciones(selectElement, observaciones) {
            // Llenar el select de observaciones
            observaciones.forEach((observacion, index) => {
                const option = document.createElement("option");
                option.value = observacion.id;
                option.text = `${index + 1}. ${observacion.descripcion}`; // Agregar el índice antes de la descripción
                option.dataset.descripcionLarga = observacion.descripcion_larga; // Usar un atributo personalizado
                selectElement.appendChild(option);
            });

        }
      
        // Función para guardar observaciones seleccionadas
        async function guardarObservacionesSeleccionadas(id_calificacion, observaciones) {
            const token = localStorage.getItem("token");

            // Decodifica el token para obtener el ID del usuario
            let id_usuario;
            if (token) {
                const decodedToken = JSON.parse(atob(token.split('.')[1])); // Esto es solo un ejemplo
                id_usuario = decodedToken.id; // Asegúrate de que esta propiedad exista
            }

            // Asegúrate de que las observaciones se envían como un array
            const observacionData = {
                _id_calificacion: id_calificacion,  // ID de la calificación correspondiente
                _observaciones: Array.isArray(observaciones) ? observaciones : [observaciones], // Asegúrate de que siempre sea un array
                _id_usuario: id_usuario                // Asegúrate de que id_usuario esté definido
            };

            try {
                const response = await fetch("/guardar-observaciones", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(observacionData)
                });

                // No se muestra ningún mensaje ni se pinta información en la consola
            } catch (error) {
                // No se muestra ningún mensaje ni se pinta información en la consola
            }
        }



        // Asegúrate de que este bloque se ejecute cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            // Obtener todos los selects que tienen observaciones
            const selectElements = document.querySelectorAll('select[id^="selectObservacion"]'); // Asegúrate de que tus selects tengan un ID que empiece con "selectObservacion"

            selectElements.forEach(selectObservacion => {
                selectObservacion.addEventListener("change", async function () {
                    const selectedOptions = Array.from(selectObservacion.selectedOptions);

                    // Limitar la selección a 2 opciones
                    if (selectedOptions.length > 2) {
                        const lastSelected = selectedOptions[selectedOptions.length - 1];
                        lastSelected.selected = false; // Desmarcar la opción más reciente
                        mostrarToast("Solo puedes seleccionar hasta 2 opciones.", "error"); // Mostrar mensaje de error
                        return; // Salir para evitar guardar observaciones
                    }

                    // Obtener las observaciones seleccionadas
                    const observacionesSeleccionadas = selectedOptions.map(option => option.value);

                    // Obtener el ID de calificación directamente del dataset
                    const id_calificacion = parseInt(selectObservacion.dataset.calificacion); // Asegúrate de que este dato esté disponible

                    // Llama a la función para guardar las observaciones seleccionadas
                    await guardarObservacionesSeleccionadas(id_calificacion, observacionesSeleccionadas);
                });

            });
        });


      // Función para crear el tooltip
      function manejarTooltip(selectElement) {
          const tooltip = document.createElement("div");
          tooltip.id = "tooltip";
          tooltip.className = "tooltip";
          tooltip.style.display = "none"; // Inicialmente oculto
          document.body.appendChild(tooltip);

          // Manejo del tooltip
          selectElement.addEventListener("mouseover", (event) => {
              if (event.target.tagName === "OPTION") {
                  tooltip.innerHTML = event.target.dataset.descripcionLarga; // Usar el atributo personalizado
                  tooltip.style.display = "block"; // Mostrar el tooltip
                  tooltip.style.left = `${event.pageX + 5}px`; // Posicionar el tooltip
                  tooltip.style.top = `${event.pageY + 5}px`;
              }
          });

          selectElement.addEventListener("mousemove", (event) => {
              if (tooltip.style.display === "block") {
                  tooltip.style.left = `${event.pageX + 5}px`; // Actualizar la posición del tooltip
                  tooltip.style.top = `${event.pageY + 5}px`;
              }
          });

          selectElement.addEventListener("mouseout", () => {
              tooltip.style.display = "none"; // Ocultar el tooltip
          });
      }



      //Verificar si un periodo está activo
      function esPeriodoActivo(periodo) {
        const fechaActual = new Date();
        const fechaInicio = new Date(periodo.fecha_inicio);
        const fechaFin = new Date(periodo.fecha_fin);

        // Si la fecha actual está dentro del rango del periodo, está activo
        return fechaActual >= fechaInicio && fechaActual <= fechaFin;
      }

      function crearDropdown(calificacionActual, periodo, periodoNumero) {
        const select = document.createElement("select");

        const calificacionesPosibles = [0, 7, 8, 9, 10]; // Opciones posibles para calificación
        calificacionesPosibles.forEach((calificacion) => {
          const option = document.createElement("option");
          option.value = calificacion;
          option.textContent = calificacion;
          option.selected = calificacion === calificacionActual;
          select.appendChild(option);
        });

        // Deshabilitar el select si el periodo no está activo
        select.disabled = !esPeriodoActivo(periodo);

        // Llamar a guardarCalificacion cuando se cambie la opción seleccionada
        select.addEventListener("change", function () {
          guardarCalificacion(this); // Pasar el elemento select modificado a la función guardarCalificacion
        });
        return select;
      }

      function mostrarToast(mensaje, tipo = "success") {
        const toastContainer = document.getElementById("toast-container");

        // Crear el elemento del toast
        const toast = document.createElement("div");
        toast.classList.add("toast", tipo);
        toast.textContent = mensaje;

        // Añadir el toast al contenedor
        toastContainer.appendChild(toast);

        // Hacer visible el toast
        setTimeout(() => {
          toast.classList.add("show");
        }, 100); // Pequeño retraso para activar la transición

        // Ocultar el toast después de 5 segundos
        setTimeout(() => {
          toast.classList.remove("show");
          setTimeout(() => {
            toast.remove();
          }, 300); // Tiempo de transición antes de eliminarlo
        }, 5000);
      }

      function guardarCalificacion(selectElement) {
          // Obtener el token del localStorage
          const token = localStorage.getItem("token");

          // Verificar si el token existe
          if (!token) {
              mostrarToast("No se ha encontrado el token de autorización.", "error"); // Muestra un toast de error
              return; // Salir de la función si no hay token
          }

          const idUsuario = decodedToken.id || "Campo nombre_completo no encontrado";
          const nuevaCalificacion = parseInt(selectElement.value); // Valor de la calificación seleccionada
          const idAlumno = selectElement.closest("tr").children[1].textContent; // Obtener el ID del alumno desde la fila
          calificacionIdSeleccionada = parseInt(
              selectElement.closest("tr").children[0].textContent
          ); // Obtener el ID de calificación desde la fila
          const idMateria = document.getElementById("materias").value; // Obtener el ID de la materia seleccionada
          const periodo = selectElement.parentElement.dataset.periodo; // Obtener el periodo desde el atributo data-periodo
          const campo = `p${periodo}`; // Determinar el campo dinámicamente

          fetch("/actualizar-calificaciones", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`, // Usa el token de autorización aquí
              },
              body: JSON.stringify({
                  _id_calificacion: calificacionIdSeleccionada, // Cambia 'id_calificacion' por '_id_calificacion'
                  _campo: campo, // Cambia esto según el campo que deseas actualizar (p1, p2, p3)
                  _nuevo_valor: nuevaCalificacion, // Cambia 'nuevo_valor' por '_nuevo_valor'
                  _id_usuario: idUsuario, // Asegúrate de incluir el id_usuario (puedes obtenerlo del token o de otra fuente)
              }),
          })
          .then((response) => {
              if (!response.ok) {
                  throw new Error("Error al actualizar la calificación");
              }
              return response.json();
          })
          .then((data) => {
              mostrarToast("Calificación actualizada correctamente."); // Muestra un toast de éxito
          })
          .catch((error) => {
              console.error("Error:", error);
              mostrarToast("Error al actualizar la calificación.", "error"); // Muestra un toast de error
          });
      }

      // Función para manejar el cierre de sesión
      function logout() {
        localStorage.removeItem("token"); // Elimina el token de localStorage
        window.location.href = "/login.html"; // Redirige al usuario a la página de inicio de sesión
      }

      document.addEventListener("DOMContentLoaded", function () {
        // Maneja el cierre de sesión
        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
          logoutButton.addEventListener("click", logout); // Llama a la función de cierre de sesión
        }
      });