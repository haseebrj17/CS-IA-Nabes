window.addEventListener('load', () => {
	const form = document.querySelector("#new-message-form");
	const input = document.querySelector("#new-message-input");
	const list_el = document.querySelector("#messages");

	form.addEventListener('submit', (e) => {
		e.preventDefault();

		const message = input.value;

		const message_el = document.createElement("div");
		message_el.classList.add("messages");

		const name_12 = "wajahat awan : "

		const message_namedive_el = document.createElement("div")
		message_el.appendChild(message_namedive_el)

		const message_name_el = document.createElement("input");
		message_name_el.classList.add("name");
		message_name_el.type = "text";
		message_name_el.value = name_12;
		message_name_el.setAttribute("readonly", "readonly");

		message_namedive_el.appendChild(message_name_el);


		const message_content_el = document.createElement("div");
		message_content_el.classList.add("content");

		message_el.appendChild(message_content_el);

		const message_input_el = document.createElement("textarea");
		message_input_el.classList.add("text");
		message_input_el.type = "text";
		message_input_el.value = message;
		message_input_el.setAttribute("readonly", "readonly");

		message_content_el.appendChild(message_input_el);
		message_input_el.style.cssText = `height: ${message_input_el.scrollHeight}px; overflow-y: hidden`;
		message_input_el.addEventListener("input", function(){
			this.style.height = "auto";
			this.style.height = `${this.scrollHeight}px`;
		});

		const message_actions_el = document.createElement("div");
		message_actions_el.classList.add("actions");

		const message_edit_el = document.createElement("button");
		message_edit_el.classList.add("edit");
		message_edit_el.innerText = "Edit";

		const message_delete_el = document.createElement("button");
		message_delete_el.classList.add("delete");
		message_delete_el.innerText = "Delete";

		message_actions_el.appendChild(message_edit_el);
		message_actions_el.appendChild(message_delete_el);

		message_el.appendChild(message_actions_el);

		list_el.appendChild(message_el);

		input.value = '';

		message_edit_el.addEventListener('click', () => {
			if (message_edit_el.innerText.toLowerCase() == "edit") {
				message_edit_el.innerText = "Save";
				message_input_el.removeAttribute("readonly");
				message_input_el.focus();
			} else {
				message_edit_el.innerText = "Edit";
				message_input_el.setAttribute("readonly", "readonly");
			}
		});

		message_delete_el.addEventListener('click', () => {
			list_el.removeChild(message_el);
		});
	});
});
