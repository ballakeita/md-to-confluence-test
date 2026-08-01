resource "null_resource" "node1" {

  count = length(var.hosts)
  provisioner "local-exec" {
    command = "echo '${element(var.hosts, count.index)}' >> hosts.txt"
  }
}
